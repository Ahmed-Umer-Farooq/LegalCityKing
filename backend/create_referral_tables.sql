-- Add referral_code to users table
ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN referred_by VARCHAR(20);
ALTER TABLE users ADD COLUMN referral_earnings DECIMAL(10,2) DEFAULT 0.00;

-- Create referrals tracking table
CREATE TABLE referrals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referrer_id INT NOT NULL,
  referee_id INT NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  reward_amount DECIMAL(10,2) DEFAULT 10.00,
  status ENUM('pending', 'completed', 'paid') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id)
);