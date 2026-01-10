// src/ui/components/IconPicker.tsx
import React from 'react';
import { Anchor, Utensils, Beer, User, Circle, Package, HelpCircle } from 'lucide-react';

// Define the list of available icons
export const availableIcons = {
  Anchor,
  Utensils,
  Beer,
  User,
  Circle,
  Package,
};

export type IconKey = keyof typeof availableIcons;

interface IconPickerProps {
  selectedIcon: IconKey | null;
  onSelectIcon: (iconKey: IconKey) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Ícone do Produto</label>
      <div className="grid grid-cols-5 gap-2 p-2 bg-gray-100 rounded-lg">
        {Object.keys(availableIcons).map((key) => {
          const iconKey = key as IconKey;
          const IconComponent = availableIcons[iconKey] || HelpCircle;
          const isSelected = selectedIcon === iconKey;

          return (
            <button
              key={iconKey}
              type="button"
              onClick={() => onSelectIcon(iconKey)}
              className={`flex items-center justify-center p-3 rounded-lg transition-all
                ${isSelected
                  ? 'bg-blue-500 text-white ring-2 ring-blue-500 ring-offset-2'
                  : 'bg-white text-gray-600 hover:bg-blue-100'
                }`}
            >
              <IconComponent size={24} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
