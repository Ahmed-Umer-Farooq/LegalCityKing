# Role-Based Access Control (RBAC) System Documentation

## Overview

The Legal City RBAC system provides a comprehensive framework for managing user permissions and access control across the platform. Built using a hybrid approach combining CASL (Ability-based) and Casbin (Policy-based) authorization, the system ensures secure, granular access control for different user types and their capabilities.

## System Architecture

### Technology Stack
- **CASL**: Ability-based permissions for fine-grained access control
- **Casbin**: Policy-based authorization with model and policy files
- **Database**: MySQL with role, permission, and user-role relationship tables
- **Caching**: In-memory caching for performance optimization
- **JWT**: Token-based authentication with role claims

### Component Structure
```
RBAC System/
├── Core Components
│   ├── RBAC Service (CASL-based)
│   ├── Casbin Enforcer (Policy-based)
│   ├── Authentication Middleware
│   └── Authorization Middleware
├── Database Layer
│   ├── Roles Table
│   ├── Permissions Table
│   ├── Role-Permissions Junction
│   └── User-Roles Junction
├── Configuration
│   ├── RBAC Model (Casbin)
│   ├── Policy CSV (Casbin)
│   └── Permission Definitions
└── Security Features
    ├── Access Control
    ├── Audit Logging
    ├── Permission Caching
    └── Role Management
```

## Core RBAC Components

### 1. RBAC Service (CASL-based)

#### Service Architecture
**Permission Management:**
```javascript
class RBACService {
  constructor() {
    this.cache = new Map(); // In-memory permission cache
  }

  async getUserAbilities(userId, userType, context = {}) {
    // Builds CASL ability instance for user
    const { can, cannot, build } = new AbilityBuilder(Ability);
    // Loads permissions from database
    // Applies conditions based on user context
    // Returns ability instance
  }

  async assignRole(userId, userType, roleName) {
    // Assigns role to user
    // Updates database
    // Clears cache
  }

  async can(userId, userType, action, resource) {
    // Checks if user can perform action on resource
  }
}
```

#### Ability Building Process
**Permission Construction:**
```javascript
const buildConditions = (permission, userId) => {
  const conditions = {};

  // Resource ownership conditions
  if (permission.resource === 'cases' || permission.resource === 'documents') {
    conditions.lawyer_id = userId; // Lawyers can only access their own cases
  }

  if (permission.resource === 'payments' && permission.role_name === 'user') {
    conditions.user_id = userId; // Users can only view their own payments
  }

  return Object.keys(conditions).length > 0 ? conditions : undefined;
};
```

### 2. Casbin Integration

#### Model Configuration
**RBAC Model (rbac_model.conf):**
```conf
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

#### Policy Configuration
**Policy CSV (rbac_policy.csv):**
```csv
# Role-based permissions
p, admin, /api/admin/*, *
p, admin, /api/users/*, *
p, admin, /api/lawyers/*, *
p, admin, /api/payments/*, *
p, admin, /api/verification/*, *
p, admin, /api/profile/*, *

p, lawyer, /api/lawyer/*, *
p, lawyer, /api/cases/*, *
p, lawyer, /api/documents/*, *
p, lawyer, /api/invoices/*, *
p, lawyer, /api/payments/create, POST
p, lawyer, /api/payments/process, POST
p, lawyer, /api/blogs/*, *
p, lawyer, /api/qa/*, *
p, lawyer, /api/profile/*, *

p, user, /api/user/*, *
p, user, /api/cases/view, GET
p, user, /api/documents/view, GET
p, user, /api/payments/create, POST
p, user, /api/payments/view, GET
p, user, /api/blogs/view, GET
p, user, /api/qa/ask, POST
p, user, /api/profile/*, *

p, client, /api/user/*, *
p, client, /api/cases/view, GET
p, client, /api/documents/view, GET
p, client, /api/payments/view, GET
p, client, /api/profile/*, *

# Role hierarchy
g, admin, admin
g, lawyer, lawyer
g, user, user
g, client, user
```

### 3. Authentication Middleware

#### JWT Authentication with RBAC
**Authentication Flow:**
```javascript
const authenticate = async (req, res, next) => {
  // Extract JWT token
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Determine user type and validate existence
  let user;
  let userType = decoded.role || 'user';

  if (userType === 'lawyer') {
    user = await db('lawyers').where({ id: decoded.id }).first();
  } else if (userType === 'admin') {
    user = await db('users').where({ id: decoded.id, is_admin: 1 }).first();
  } else {
    user = await db('users').where({ id: decoded.id, is_admin: 0 }).first();
  }

  if (!user) {
    return res.status(403).json({ error: 'User account not found' });
  }

  // Load user abilities
  const abilities = await rbacService.getUserAbilities(decoded.id, userType, {
    ip: req.ip,
    time: new Date(),
    userAgent: req.get('User-Agent'),
    forceRefresh: userType === 'lawyer' // Always refresh lawyer permissions
  });

  // Attach user to request
  req.user = {
    id: decoded.id,
    email: user.email,
    type: userType,
    role: userType,
    abilities,
    ...user
  };

  next();
};
```

## Database Schema

### Core RBAC Tables

#### Roles Table
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  level INT DEFAULT 0, -- Hierarchical level for role comparison
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample roles
INSERT INTO roles (name, description, level) VALUES
('admin', 'Administrator with full access', 90),
('lawyer', 'Basic lawyer access', 50),
('verified_lawyer', 'Verified lawyer with enhanced permissions', 60),
('user', 'Regular user access', 10),
('client', 'Client with limited access', 5);
```

#### Permissions Table
```sql
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL, -- e.g., 'cases', 'payments', 'admin'
  action VARCHAR(50) NOT NULL,   -- e.g., 'read', 'write', 'manage'
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample permissions
INSERT INTO permissions (name, resource, action, description) VALUES
('admin.manage', 'admin', 'manage', 'Full administrative access'),
('lawyer.payments.write', 'payments', 'write', 'Create payment links'),
('lawyer.cases.manage', 'cases', 'manage', 'Manage legal cases'),
('user.payments.read', 'payments', 'read', 'View payment information'),
('user.profile.manage', 'profile', 'manage', 'Manage user profile');
```

#### Role-Permissions Junction Table
```sql
CREATE TABLE role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_role_permission (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

#### User-Roles Junction Table
```sql
CREATE TABLE user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  user_type VARCHAR(20) NOT NULL, -- 'user', 'lawyer', 'admin'
  role_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_id, user_type, role_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

## Authorization Middleware

### Permission-Based Authorization
**CASL Ability Checking:**
```javascript
const authorize = (action, resource) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const canAccess = req.user.abilities.can(action, resource);

    if (!canAccess) {
      return res.status(403).json({
        error: `Access denied: ${action} ${resource} not allowed`,
        required: `${action}:${resource}`
      });
    }

    next();
  };
};
```

**Casbin Policy Checking:**
```javascript
const authorize = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userRole = req.user.role || 'user';
      const allowed = await enforcer.enforce(userRole, resource, action);

      if (!allowed) {
        logger.warn('Authorization failed', {
          userId: req.user.id,
          role: userRole,
          resource,
          action,
          ip: req.ip
        });
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};
```

### Role-Based Authorization
**Role Requirement Checking:**
```javascript
const requireRole = (roleName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userRoles = await rbacService.getUserRoles(req.user.id, req.user.type);
      const hasRole = userRoles.some(role => role.name === roleName);

      if (!hasRole) {
        console.log(`Role access denied: user ${req.user.id} lacks ${roleName} role`);
        return res.status(403).json({
          error: `Access denied: ${roleName} role required`
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Role verification failed' });
    }
  };
};
```

### Specialized Authorization

#### Verified Lawyer Requirements
**Verification + Subscription Checking:**
```javascript
const requireVerifiedLawyer = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.type !== 'lawyer') {
    return res.status(403).json({ error: 'Lawyer access required' });
  }

  try {
    const lawyer = await db('lawyers')
      .where({ id: req.user.id })
      .first();

    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer account not found' });
    }

    // Check verification status
    const isVerified = lawyer.verification_status === 'approved' ||
                      lawyer.is_verified === true;

    if (!isVerified) {
      return res.status(403).json({
        error: 'Account verification required',
        code: 'VERIFICATION_REQUIRED'
      });
    }

    // Add subscription info
    req.user.subscription = {
      tier: lawyer.subscription_tier,
      status: lawyer.subscription_status,
      expires_at: lawyer.subscription_expires_at
    };

    req.user.is_verified = true;
    req.user.verification_status = lawyer.verification_status;

    next();
  } catch (error) {
    console.error('Lawyer verification check error:', error);
    return res.status(500).json({ error: 'Verification check failed' });
  }
};
```

#### Payment Access Control
**Payment-Specific Permissions:**
```javascript
const requirePaymentAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const canAccess = req.user.abilities.can('write', 'payments') ||
                     req.user.abilities.can('read', 'payments');

    if (!canAccess) {
      console.log(`Payment access denied for user ${req.user.id} (${req.user.type})`);
      return res.status(403).json({
        error: 'Payment access denied'
      });
    }

    next();
  } catch (error) {
    console.error('Payment access check error:', error);
    return res.status(500).json({ error: 'Payment access verification failed' });
  }
};
```

#### Resource Ownership Verification
**Ownership-Based Access:**
```javascript
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin bypass
    const userRoles = await rbacService.getUserRoles(req.user.id, req.user.type);
    const isAdmin = userRoles.some(role => role.name === 'admin');

    if (isAdmin) {
      return next();
    }

    try {
      const resourceId = req.params.id;
      let resource;

      switch (resourceType) {
        case 'blog':
          resource = await db('blogs')
            .where('secure_id', resourceId)
            .orWhere('id', resourceId)
            .first();
          break;
        case 'case':
          resource = await db('cases').where('id', resourceId).first();
          break;
        case 'document':
          resource = await db('documents').where('id', resourceId).first();
          break;
      }

      if (!resource) {
        return res.status(404).json({ error: `${resourceType} not found` });
      }

      // Check ownership
      const ownerField = resourceType === 'blog' ? 'author_id' : 'user_id';
      if (resource[ownerField] !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: Resource not owned by user' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Ownership verification failed' });
    }
  };
};
```

## Permission Definitions

### Role Hierarchy and Permissions

#### Admin Role (Level 90)
**Full System Access:**
- **Resource**: All system resources
- **Actions**: manage, read, write, delete
- **Scope**: Global access to all features
- **Restrictions**: None

**Specific Permissions:**
```javascript
adminPermissions = {
  users: ['manage'],           // Full user management
  lawyers: ['manage'],         // Full lawyer management
  payments: ['manage'],        // Full payment system access
  verification: ['manage'],    // Full verification control
  system: ['manage'],          // System administration
  analytics: ['read'],         // View all analytics
  logs: ['read']               // Access system logs
};
```

#### Verified Lawyer Role (Level 60)
**Enhanced Professional Access:**
- **Resource**: Lawyer-specific features
- **Actions**: read, write, manage (own resources)
- **Scope**: Own cases, clients, payments
- **Restrictions**: Cannot access other lawyers' data

**Specific Permissions:**
```javascript
verifiedLawyerPermissions = {
  cases: ['manage'],           // Full case management
  clients: ['manage'],         // Client relationship management
  documents: ['manage'],       // Document management
  payments: ['write'],         // Create payment links
  blogs: ['manage'],           // Content publishing
  qa: ['manage'],              // Q&A participation
  profile: ['manage'],         // Profile management
  dashboard: ['read'],         // Dashboard access
  calendar: ['manage'],        // Schedule management
  contacts: ['manage'],        // Contact management
  messages: ['manage'],        // Communication tools
  payouts: ['manage'],         // Earnings management
  tasks: ['manage'],           // Task management
  reports: ['read'],           // Basic reporting
  forms: ['manage'],           // Form management
  subscription: ['manage'],    // Subscription management
  ai_analyzer: ['manage'],     // AI analysis tools
  quick_actions: ['manage']    // Quick action features
};
```

#### Basic Lawyer Role (Level 50)
**Standard Professional Access:**
- **Resource**: Basic lawyer features
- **Actions**: read, write (own resources)
- **Scope**: Limited to personal workspace
- **Restrictions**: Cannot create payment links, limited client features

**Specific Permissions:**
```javascript
lawyerPermissions = {
  cases: ['manage'],           // Case management
  documents: ['manage'],       // Document handling
  blogs: ['manage'],           // Content creation
  qa: ['manage'],              // Q&A participation
  profile: ['manage'],         // Profile management
  dashboard: ['read'],         // Dashboard access
  calendar: ['read'],          // Schedule viewing
  contacts: ['read'],          // Contact viewing
  messages: ['read'],          // Message reading
  tasks: ['read'],             // Task viewing
  forms: ['read']              // Form viewing
};
```

#### User Role (Level 10)
**Client Access:**
- **Resource**: User-specific features
- **Actions**: read, limited write
- **Scope**: Personal account and interactions
- **Restrictions**: Cannot access professional tools

**Specific Permissions:**
```javascript
userPermissions = {
  profile: ['manage'],         // Profile management
  cases: ['read'],             // View assigned cases
  documents: ['read'],         // View shared documents
  payments: ['read', 'write'], // View and make payments
  blogs: ['read'],             // Read blog content
  qa: ['write'],               // Ask questions
  dashboard: ['read'],         // Dashboard access
  calendar: ['read'],          // View appointments
  contacts: ['read'],          // View contacts
  messages: ['read', 'write'], // Communication
  tasks: ['read'],             // View assigned tasks
  forms: ['read', 'write'],    // Form interactions
  directory: ['read'],         // Lawyer directory
  refer: ['write'],            // Referral system
  accounting: ['read'],        // Basic accounting view
  social_media: ['read']       // Social features
};
```

#### Client Role (Level 5)
**Limited Client Access:**
- **Resource**: Minimal client features
- **Actions**: read only
- **Scope**: Very limited personal access
- **Restrictions**: Cannot write or modify data

**Specific Permissions:**
```javascript
clientPermissions = {
  profile: ['manage'],         // Basic profile management
  cases: ['read'],             // View own cases
  documents: ['read'],         // View own documents
  payments: ['read'],          // View payment history
  dashboard: ['read'],         // Basic dashboard
  calendar: ['read'],          // View appointments
  messages: ['read']           // Read messages
};
```

## API Endpoints

### Role Management

#### Get User Roles
```javascript
// GET /api/auth/roles
// Get current user's roles and permissions
const getUserRoles = async () => {
  const response = await api.get('/api/auth/roles');
  return response.data; // Array of role objects with permissions
};

// Response format
{
  roles: [
    {
      name: 'lawyer',
      description: 'Basic lawyer access',
      level: 50,
      permissions: [
        { resource: 'cases', action: 'manage' },
        { resource: 'documents', action: 'manage' },
        // ... more permissions
      ]
    }
  ]
}
```

#### Check Permission
```javascript
// POST /api/auth/check-permission
// Check if user has specific permission
const checkPermission = async (action, resource) => {
  const response = await api.post('/api/auth/check-permission', {
    action,
    resource
  });
  return response.data; // { allowed: true/false, reason: string }
};
```

### Administrative Endpoints

#### Role Assignment (Admin Only)
```javascript
// POST /api/admin/users/:userId/roles
// Assign role to user (admin only)
const assignRole = async (userId, roleName, userType = 'user') => {
  const response = await api.post(`/api/admin/users/${userId}/roles`, {
    roleName,
    userType
  });
  return response.data; // Success confirmation
};

// DELETE /api/admin/users/:userId/roles/:roleName
// Remove role from user (admin only)
const removeRole = async (userId, roleName, userType = 'user') => {
  const response = await api.delete(`/api/admin/users/${userId}/roles/${roleName}`, {
    data: { userType }
  });
  return response.data; // Success confirmation
};
```

#### Permission Management (Admin Only)
```javascript
// GET /api/admin/permissions
// Get all permissions (admin only)
const getAllPermissions = async () => {
  const response = await api.get('/api/admin/permissions');
  return response.data; // Array of all permissions
};

// POST /api/admin/roles/:roleId/permissions
// Assign permission to role (admin only)
const assignPermissionToRole = async (roleId, permissionId) => {
  const response = await api.post(`/api/admin/roles/${roleId}/permissions`, {
    permissionId
  });
  return response.data; // Success confirmation
};
```

## Security Features

### Permission Caching
**Cache Management:**
```javascript
class RBACService {
  constructor() {
    this.cache = new Map();
  }

  clearUserCache(userId, userType) {
    this.cache.delete(`${userId}-${userType}`);
  }

  // Cache is cleared on role changes
  async assignRole(userId, userType, roleName) {
    // ... role assignment logic
    this.clearUserCache(userId, userType);
  }
}
```

### Audit Logging
**Permission Tracking:**
```javascript
const auditLog = (event, details = {}) => {
  logger.info('RBAC audit', {
    event, // 'permission_check', 'role_assigned', 'access_denied'
    timestamp: new Date().toISOString(),
    userId: details.userId,
    role: details.role,
    resource: details.resource,
    action: details.action,
    allowed: details.allowed,
    ip: details.ip,
    userAgent: details.userAgent
  });
};
```

### Rate Limiting
**Authorization Rate Limits:**
```javascript
// Different limits for different authorization types
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many auth attempts');
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests');
const paymentLimiter = createRateLimiter(60 * 60 * 1000, 10, 'Too many payment attempts');
```

## Setup and Configuration

### RBAC System Initialization
**Setup Script Execution:**
```bash
# Navigate to backend directory
cd backend

# Run RBAC setup script
node setup-rbac.js

# Expected output:
# Setting up RBAC system...
# ✅ Tables created
# ✅ Roles and permissions created
# ✅ Role-permission assignments created
# ✅ Existing users migrated
# 🎉 RBAC setup completed successfully!
```

### Database Migration
**Migration Process:**
```javascript
// setup-rbac.js key operations
const setupRBAC = async () => {
  // 1. Drop existing tables
  await db.schema.dropTableIfExists('user_roles');
  await db.schema.dropTableIfExists('role_permissions');
  await db.schema.dropTableIfExists('permissions');
  await db.schema.dropTableIfExists('roles');

  // 2. Create tables
  await createTables();

  // 3. Seed initial data
  await seedRolesAndPermissions();

  // 4. Assign permissions to roles
  await assignRolePermissions();

  // 5. Migrate existing users
  await rbacService.migrateExistingUsers();
};
```

### Configuration Files
**Model File (rbac_model.conf):**
- Defines request, policy, and role structures
- Configures policy effects and matchers
- Sets up role hierarchy rules

**Policy File (rbac_policy.csv):**
- Contains role-based permission assignments
- Defines resource-action mappings
- Establishes role inheritance rules

## Usage Examples

### Basic Permission Checking
```javascript
// In route handlers
const express = require('express');
const { authenticate, authorize } = require('../middleware/modernAuth');

const router = express.Router();

// Protect route with specific permission
router.get('/cases', authenticate, authorize('read', 'cases'), async (req, res) => {
  // User has 'read' permission on 'cases' resource
  const cases = await getUserCases(req.user.id);
  res.json(cases);
});

// Protect route with role requirement
router.post('/cases', authenticate, requireRole('lawyer'), async (req, res) => {
  // User must have 'lawyer' role
  const newCase = await createCase(req.body, req.user.id);
  res.json(newCase);
});
```

### Advanced Authorization
```javascript
// Combined checks
router.put('/cases/:id', 
  authenticate, 
  requireVerifiedLawyer, 
  requireOwnership('case'), 
  authorize('write', 'cases'), 
  async (req, res) => {
    // User must be:
    // 1. Authenticated
    // 2. Verified lawyer
    // 3. Owner of the case
    // 4. Have write permission on cases
    const updatedCase = await updateCase(req.params.id, req.body);
    res.json(updatedCase);
  }
);
```

### Frontend Integration
```javascript
// Check permissions in React components
const LawyerDashboard = () => {
  const [canCreatePayments, setCanCreatePayments] = useState(false);
  const [canManageClients, setCanManageClients] = useState(false);

  useEffect(() => {
    // Check user abilities
    const checkPermissions = async () => {
      try {
        const paymentAccess = await api.post('/api/auth/check-permission', {
          action: 'write',
          resource: 'payments'
        });
        const clientAccess = await api.post('/api/auth/check-permission', {
          action: 'manage',
          resource: 'clients'
        });

        setCanCreatePayments(paymentAccess.data.allowed);
        setCanManageClients(clientAccess.data.allowed);
      } catch (error) {
        console.error('Permission check failed:', error);
      }
    };

    checkPermissions();
  }, []);

  return (
    <div className="dashboard">
      {canCreatePayments && (
        <PaymentLinkCreator />
      )}
      {canManageClients && (
        <ClientManager />
      )}
    </div>
  );
};
```

## Performance Optimization

### Caching Strategy
**Permission Cache:**
- In-memory Map for fast lookups
- Cache key: `${userId}-${userType}`
- Cache invalidation on role changes
- Force refresh for critical operations

### Database Optimization
**Query Optimization:**
- Indexed foreign key columns
- Efficient JOIN operations
- Minimal data selection
- Connection pooling

### Monitoring and Metrics
**Performance Metrics:**
```javascript
const rbacMetrics = {
  cacheHitRate: () => {
    // Calculate cache effectiveness
  },
  averagePermissionCheckTime: () => {
    // Measure authorization performance
  },
  failedAuthorizationAttempts: () => {
    // Track security incidents
  }
};
```

## Troubleshooting Guide

### Common RBAC Issues

#### Permission Denied Errors

1. **User Abilities Not Loading**
   - **Symptom**: User can access some features but not others
   - **Solution**: Clear permission cache and refresh session
   - **Prevention**: Implement proper cache invalidation

2. **Role Assignment Failures**
   - **Symptom**: User doesn't get expected permissions after role assignment
   - **Solution**: Check database for role-permission relationships
   - **Prevention**: Validate role assignments before granting access

3. **Middleware Bypass**
   - **Symptom**: Unauthorized access to protected routes
   - **Solution**: Verify middleware order and configuration
   - **Prevention**: Implement comprehensive route protection

#### Performance Issues

1. **Slow Permission Checks**
   - **Symptom**: Authorization delays in API responses
   - **Solution**: Optimize database queries and implement caching
   - **Prevention**: Monitor query performance and cache hit rates

2. **Memory Leaks**
   - **Symptom**: Increasing memory usage over time
   - **Solution**: Implement proper cache cleanup and garbage collection
   - **Prevention**: Set cache TTL and size limits

#### Configuration Problems

1. **Casbin Policy Errors**
   - **Symptom**: Policy enforcement not working as expected
   - **Solution**: Validate model and policy file syntax
   - **Prevention**: Use policy validation tools

2. **Database Connection Issues**
   - **Symptom**: RBAC service unable to connect to database
   - **Solution**: Check database credentials and connection pool
   - **Prevention**: Implement connection retry logic

### Debug Procedures

#### Permission Debugging
```javascript
// Enable debug logging
const debugPermissions = async (userId, userType) => {
  console.log('=== RBAC DEBUG ===');
  console.log('User ID:', userId);
  console.log('User Type:', userType);

  // Get user roles
  const roles = await rbacService.getUserRoles(userId, userType);
  console.log('User Roles:', roles);

  // Get user abilities
  const abilities = await rbacService.getUserAbilities(userId, userType);
  console.log('User Abilities:', abilities.rules);

  // Test specific permission
  const canReadCases = abilities.can('read', 'cases');
  console.log('Can read cases:', canReadCases);
};
```

#### Database Verification
```sql
-- Check user roles
SELECT ur.*, r.name as role_name, r.level
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = ? AND ur.user_type = ?;

-- Check role permissions
SELECT rp.*, p.name as permission_name, p.resource, p.action
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = ?;

-- Check user permissions
SELECT DISTINCT p.resource, p.action, p.name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = ? AND ur.user_type = ?;
```

## Conclusion

The Legal City RBAC system provides a robust, flexible, and scalable authorization framework that ensures secure access control across all platform features. By combining CASL's ability-based permissions with Casbin's policy-based authorization, the system offers both fine-grained control and high-level policy management.

The system's modular design supports easy integration with new features and user types, while the comprehensive caching and audit logging ensure optimal performance and security. With clear role hierarchies, granular permissions, and extensive middleware support, it provides a solid foundation for managing complex authorization requirements in a multi-user legal services platform.
