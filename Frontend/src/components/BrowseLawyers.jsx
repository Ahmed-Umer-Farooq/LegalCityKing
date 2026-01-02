import { Link } from "react-router-dom";

const practiceAreas = [
  [
    "Adoption Lawyers",
    "Appeals Lawyers",
    "Bankruptcy Attorneys",
    "Business Attorneys",
    "Cannabis Law Attorneys",
    "Car Accident Lawyers",
    "Child Custody Lawyers",
    "Child Support Lawyers",
    "Civil Rights Attorneys",
    "Class Action Attorneys",
    "Construction Lawyers",
    "Consumer Protection Attorneys",
    "Contracts Lawyers",
  ],
  [
    "Credit Repair Attorneys",
    "Criminal Defense Attorneys",
    "Debt Collection Attorneys",
    "Debt Settlement Attorneys",
    "Discrimination Lawyers",
    "Divorce Lawyers",
    "Domestic Violence Lawyers",
    "Drug Crime Attorneys",
    "DUI / DWI Attorneys",
    "Education Law Attorneys",
    "Elder Law Attorneys",
    "Employment / Labor Attorneys",
    "Entertainment Lawyers",
  ],
  [
    "Estate Planning Attorneys",
    "Family Law Attorneys",
    "Federal Crime Lawyers",
    "Foreclosure Attorneys",
    "Guardianship Law Attorneys",
    "Immigration Attorneys",
    "Insurance Lawyers",
    "Juvenile Law Attorneys",
    "Landlord & Tenant Lawyers",
    "Lawsuit / Dispute Attorneys",
    "LGBT+ Attorneys",
    "Litigation Lawyers",
    "Mediation Attorneys",
  ],
  [
    "Medical Malpractice Attorneys",
    "Personal Injury Lawyers",
    "Probate Attorneys",
    "Real Estate Attorneys",
    "Sexual Harassment Attorneys",
    "Slip and Fall Lawyers",
    "Social Security & Disability Lawyers",
    "Speeding Ticket Lawyers",
    "Tax Lawyers",
    "Trusts Attorneys",
    "Wills Lawyers",
    "Workers Compensation Lawyers",
    "Wrongful Death Attorneys",
  ],
  [
    "Wrongful Termination Lawyers",
    "Banking Law Attorneys",
    "Constitutional Law Attorneys",
    "Copyright Application Attorneys",
    "Corporate Lawyers",
    "Financial Markets and Services Attorneys",
    "Life Insurance Attorneys",
    "Admiralty / Maritime Attorneys",
    "Medicaid / Medicare Attorneys",
    "Prenuptials Lawyers",
    "Sex Crime Attorneys",
  ],
];

const cities = [
  [
    "Atlanta Lawyers",
    "Austin Lawyers",
    "Baltimore Lawyers",
    "Boston Lawyers",
    "Brooklyn Lawyers",
    "Buffalo Lawyers",
    "Charlotte Lawyers",
    "Chicago Lawyers",
    "Cincinnati Lawyers",
    "Cleveland Lawyers",
    "More Locations...",
  ],
  [
    "Columbus Lawyers",
    "Dallas Lawyers",
    "Denver Lawyers",
    "Detroit Lawyers",
    "El Paso Lawyers",
    "Fort Lauderdale Lawyers",
    "Fort Worth Lawyers",
    "Fresno Lawyers",
    "Houston Lawyers",
    "Indianapolis Lawyers",
  ],
  [
    "Jacksonville Lawyers",
    "Kansas City Lawyers",
    "Knoxville Lawyers",
    "Las Vegas Lawyers",
    "Los Angeles Lawyers",
    "Memphis Lawyers",
    "Miami Lawyers",
    "Milwaukee Lawyers",
    "Minneapolis Lawyers",
    "Nashville Lawyers",
  ],
  [
    "New York Lawyers",
    "Orlando Lawyers",
    "Philadelphia Lawyers",
    "Phoenix Lawyers",
    "Pittsburgh Lawyers",
    "Portland Lawyers",
    "Raleigh Lawyers",
    "Riverside Lawyers",
    "Sacramento Lawyers",
    "Saint Louis Lawyers",
  ],
  [
    "San Antonio Lawyers",
    "San Diego Lawyers",
    "San Francisco Lawyers",
    "San Jose Lawyers",
    "Seattle Lawyers",
    "Spokane Lawyers",
    "Tacoma Lawyers",
    "Tampa Lawyers",
    "Tucson Lawyers",
    "Washington Lawyers",
  ],
];

const states = [
  [
    "Alabama Lawyers",
    "Alaska Lawyers",
    "Arizona Lawyers",
    "Arkansas Lawyers",
    "California Lawyers",
    "Colorado Lawyers",
    "Connecticut Lawyers",
    "Delaware Lawyers",
    "Dist. of Columbia Lawyers",
    "Florida Lawyers",
    "Georgia Lawyers",
  ],
  [
    "Hawaii Lawyers",
    "Idaho Lawyers",
    "Illinois Lawyers",
    "Indiana Lawyers",
    "Iowa Lawyers",
    "Kansas Lawyers",
    "Kentucky Lawyers",
    "Louisiana Lawyers",
    "Maine Lawyers",
    "Maryland Lawyers",
    "Massachusetts Lawyers",
  ],
  [
    "Michigan Lawyers",
    "Minnesota Lawyers",
    "Mississippi Lawyers",
    "Missouri Lawyers",
    "Montana Lawyers",
    "Nebraska Lawyers",
    "Nevada Lawyers",
    "New Hampshire Lawyers",
    "New Jersey Lawyers",
    "New Mexico Lawyers",
    "New York Lawyers",
  ],
  [
    "North Carolina Lawyers",
    "North Dakota Lawyers",
    "Ohio Lawyers",
    "Oklahoma Lawyers",
    "Oregon Lawyers",
    "Pennsylvania Lawyers",
    "Rhode Island Lawyers",
    "South Carolina Lawyers",
    "South Dakota Lawyers",
    "Tennessee Lawyers",
    "Texas Lawyers",
  ],
  [
    "Utah Lawyers",
    "Vermont Lawyers",
    "Virginia Lawyers",
    "Washington Lawyers",
    "West Virginia Lawyers",
    "Wisconsin Lawyers",
    "Wyoming Lawyers",
  ],
];

export default function BrowseLawyers() {
  return (
    <div className="w-full px-4 sm:px-6 md:px-12 py-12 md:py-16 lg:py-[82px]">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-12 lg:gap-[48px]">
        <div className="flex flex-col gap-4">
          <h2 className="text-lawyer-gray-text font-inter text-2xl md:text-[26px] font-bold leading-[34px]">
            Browse lawyers
          </h2>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-lawyer-gray-text font-inter text-lg md:text-[19px] font-bold leading-[26px]">
              By practice area
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 md:gap-x-[27px] gap-y-5">
              {practiceAreas.map((column, columnIndex) => (
                <div key={columnIndex} className="flex flex-col gap-[19px]">
                  {column.map((item, itemIndex) => {
                    const practiceArea = item.replace(' Lawyers', '').replace(' Attorneys', '');
                    return (
                      <Link
                        key={itemIndex}
                        to={`/lawyers?practiceArea=${encodeURIComponent(practiceArea)}`}
                        className="text-lawyer-cyan font-inter text-sm font-normal leading-[15.66px] hover:underline"
                      >
                        {item}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="text-lawyer-gray-text font-inter text-lg md:text-[19px] font-bold leading-[26px]">
            By city
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 md:gap-x-[92px] gap-y-5">
            {cities.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col gap-[19px]">
                {column.map((item, itemIndex) => {
                  const city = item.replace(' Lawyers', '');
                  return (
                    <Link
                      key={itemIndex}
                      to={`/lawyers?city=${encodeURIComponent(city)}`}
                      className="text-lawyer-cyan font-inter text-sm font-normal leading-[15.66px] hover:underline"
                    >
                      {item}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="text-lawyer-gray-text font-inter text-lg md:text-[19px] font-bold leading-[26px]">
            By state
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 md:gap-x-[68px] gap-y-5">
            {states.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col gap-[19px]">
                {column.map((item, itemIndex) => {
                  const state = item.replace(' Lawyers', '');
                  return (
                    <Link
                      key={itemIndex}
                      to={`/lawyers?state=${encodeURIComponent(state)}`}
                      className="text-lawyer-cyan font-inter text-sm font-normal leading-[15.66px] hover:underline"
                    >
                      {item}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}