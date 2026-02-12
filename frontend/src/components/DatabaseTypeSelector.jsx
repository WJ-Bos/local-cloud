import React from 'react';

const DATABASE_TYPES = [
  {
    id: 'POSTGRESQL',
    name: 'PostgreSQL',
    description: 'Relational · Advanced',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    accentColor: 'border-blue-500/60 bg-blue-500/[0.07]',
    defaultPort: 5433
  },
  {
    id: 'MYSQL',
    name: 'MySQL',
    description: 'Relational · Popular',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    color: 'from-orange-500 to-orange-600',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-500/10',
    accentColor: 'border-orange-500/60 bg-orange-500/[0.07]',
    defaultPort: 3306
  },
  {
    id: 'MONGODB',
    name: 'MongoDB',
    description: 'Document · NoSQL',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-500/10',
    accentColor: 'border-green-500/60 bg-green-500/[0.07]',
    defaultPort: 27017
  },
  {
    id: 'REDIS',
    name: 'Redis',
    description: 'In-memory · Cache',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
    color: 'from-red-500 to-red-600',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500/10',
    accentColor: 'border-red-500/60 bg-red-500/[0.07]',
    defaultPort: 6379
  },
  {
    id: 'MARIADB',
    name: 'MariaDB',
    description: 'Relational · MySQL compat',
    logo: 'https://mariadb.com/wp-content/uploads/2019/11/mariadb-logo-vert_blue-transparent.png',
    color: 'from-teal-500 to-teal-600',
    borderColor: 'border-teal-500',
    bgColor: 'bg-teal-500/10',
    accentColor: 'border-teal-500/60 bg-teal-500/[0.07]',
    defaultPort: 3307
  }
];

const DatabaseTypeSelector = ({ selectedType, onTypeSelect }) => {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
        Database Engine <span className="text-red-400">*</span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {DATABASE_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeSelect(type.id)}
              className={`
                relative group rounded-xl border p-3 flex flex-col items-center gap-2.5 transition-all duration-150
                ${isSelected
                  ? `${type.accentColor} shadow-sm`
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                }
              `}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-2 h-2 text-black" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                </span>
              )}

              {/* Logo */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0 transition-colors ${
                isSelected ? type.bgColor : 'bg-white/[0.04]'
              }`}>
                <img
                  src={type.logo}
                  alt={type.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Name */}
              <div className="text-center">
                <div className={`text-xs font-semibold transition-colors ${
                  isSelected ? 'text-white' : 'text-primary-gray-400 group-hover:text-white'
                }`}>
                  {type.name}
                </div>
                <div className={`text-[10px] mt-0.5 transition-colors ${
                  isSelected ? 'text-white/50' : 'text-primary-gray-700'
                }`}>
                  {type.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { DATABASE_TYPES };
export default DatabaseTypeSelector;
