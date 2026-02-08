import React from 'react';

const DATABASE_TYPES = [
  {
    id: 'POSTGRESQL',
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    defaultPort: 5433
  },
  {
    id: 'MYSQL',
    name: 'MySQL',
    description: 'Popular open-source relational database',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    color: 'from-orange-500 to-orange-600',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-500/10',
    defaultPort: 3306
  },
  {
    id: 'MONGODB',
    name: 'MongoDB',
    description: 'Document-oriented NoSQL database',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-500/10',
    defaultPort: 27017
  },
  {
    id: 'REDIS',
    name: 'Redis',
    description: 'In-memory data structure store',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
    color: 'from-red-500 to-red-600',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500/10',
    defaultPort: 6379
  },
  {
    id: 'MARIADB',
    name: 'MariaDB',
    description: 'MySQL-compatible relational database',
    logo: 'https://mariadb.com/wp-content/uploads/2019/11/mariadb-logo-vert_blue-transparent.png',
    color: 'from-teal-500 to-teal-600',
    borderColor: 'border-teal-500',
    bgColor: 'bg-teal-500/10',
    defaultPort: 3307
  }
];

const DatabaseTypeSelector = ({ selectedType, onTypeSelect }) => {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          Database Type
          <span className="text-red-400">*</span>
        </span>
      </label>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {DATABASE_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onTypeSelect(type.id)}
            className={`
              group relative p-6 rounded-xl border-2 transition-all duration-200
              ${selectedType === type.id
                ? `${type.borderColor} bg-gradient-to-br ${type.color} shadow-lg scale-105`
                : 'border-primary-gray-700 bg-primary-gray-900/30 hover:border-primary-gray-600 hover:bg-primary-gray-900/50'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-3">
              {/* Logo */}
              <div className={`
                w-16 h-16 flex items-center justify-center rounded-lg transition-all
                ${selectedType === type.id
                  ? 'bg-white/10 backdrop-blur-sm'
                  : 'bg-primary-gray-800/50 group-hover:bg-primary-gray-800'
                }
              `}>
                <img
                  src={type.logo}
                  alt={`${type.name} logo`}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* Name */}
              <div className={`
                text-sm font-bold text-center
                ${selectedType === type.id
                  ? 'text-white'
                  : 'text-primary-gray-300 group-hover:text-white'
                }
                transition-colors
              `}>
                {type.name}
              </div>

              {/* Description */}
              <div className={`
                text-xs text-center leading-relaxed
                ${selectedType === type.id
                  ? 'text-white/80'
                  : 'text-primary-gray-500 group-hover:text-primary-gray-400'
                }
                transition-colors
              `}>
                {type.description}
              </div>

              {/* Selected Indicator */}
              {selectedType === type.id && (
                <div className="absolute top-2 right-2">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export { DATABASE_TYPES };
export default DatabaseTypeSelector;
