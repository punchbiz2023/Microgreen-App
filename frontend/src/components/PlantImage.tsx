import React, { useState } from 'react';
import { Sprout } from 'lucide-react';

interface PlantImageProps {
    seedName: string;
    className?: string;
    alt?: string;
}

// Map of common microgreens to high-quality Unsplash images
const IMAGE_MAP: Record<string, string> = {
    'Sunflower': 'https://images.unsplash.com/photo-1595855709915-bd9867c26569?auto=format&fit=crop&q=80&w=600',
    'Pea': 'https://images.unsplash.com/photo-1592323678097-47960fc5b2c7?auto=format&fit=crop&q=80&w=600',
    'Radish': 'https://images.unsplash.com/photo-1591461642878-43398f6574dc?auto=format&fit=crop&q=80&w=600',
    'Broccoli': 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=600',
    'Wheatgrass': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600',
    'Cilantro': 'https://images.unsplash.com/photo-1597843708819-22a96a3e1c66?auto=format&fit=crop&q=80&w=600',
    'Basil': 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?auto=format&fit=crop&q=80&w=600',
    'Arugula': 'https://images.unsplash.com/photo-1549410141-863116543d37?auto=format&fit=crop&q=80&w=600',
    'Mustard': 'https://images.unsplash.com/photo-1508215915444-42f89c670a64?auto=format&fit=crop&q=80&w=600',
    'Kale': 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=600'
};

const PlantImage: React.FC<PlantImageProps> = ({ seedName, className = '', alt }) => {
    const [error, setError] = useState(false);

    // Simple fuzzy match or default
    const findImage = (name: string): string | undefined => {
        const key = Object.keys(IMAGE_MAP).find(k => name.toLowerCase().includes(k.toLowerCase()));
        return key ? IMAGE_MAP[key] : undefined;
    };

    const imageUrl = findImage(seedName);

    // Force fallback to remove pictures of plants for now
    if (true || error || !imageUrl) {
        return (
            <div className={`bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center ${className}`}>
                <Sprout className="text-green-600 w-1/3 h-1/3 opacity-50" />
            </div>
        );
    }

    return (
        <div className={`overflow-hidden bg-gray-100 ${className}`}>
            <img
                src={imageUrl!}
                alt={alt || seedName}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                onError={() => setError(true)}
            />
        </div>
    );
};

export default PlantImage;
