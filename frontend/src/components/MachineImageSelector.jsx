import React from 'react';
import { MACHINE_IMAGES } from './instanceCatalog';

const MachineImageSelector = ({ selectedImage, onImageSelect }) => {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
        Machine Image (AMI) <span className="text-red-400">*</span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {MACHINE_IMAGES.map((image) => {
          const isSelected = selectedImage === image.id;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => onImageSelect(image.id)}
              className={`
                relative group rounded-xl border p-3 flex flex-col items-center gap-2.5 transition-all duration-150
                ${isSelected
                  ? `${image.accentColor} shadow-sm`
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
                isSelected ? image.bgColor : 'bg-white/[0.04]'
              }`}>
                <img
                  src={image.logo}
                  alt={image.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Name */}
              <div className="text-center">
                <div className={`text-xs font-semibold transition-colors ${
                  isSelected ? 'text-white' : 'text-primary-gray-400 group-hover:text-white'
                }`}>
                  {image.name}
                </div>
                <div className={`text-[10px] mt-0.5 transition-colors ${
                  isSelected ? 'text-white/50' : 'text-primary-gray-700'
                }`}>
                  {image.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MachineImageSelector;
