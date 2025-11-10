// context/LocationContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

interface LocationContextType {
    // Địa chỉ người dùng đã chọn (tỉnh/tp hoặc toàn quốc)
    activeLocationName: string; 
    setActiveLocationName: (location: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocationContext = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocationContext must be used within a LocationProvider');
    }
    return context;
};

// Dùng 'Toàn quốc' làm mặc định ban đầu
const initialLocation = 'Toàn quốc'; 

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeLocationName, setActiveLocationName] = useState<string>(initialLocation);

    return (
        <LocationContext.Provider value={{ activeLocationName, setActiveLocationName }}>
            {children}
        </LocationContext.Provider>
    );
};