export interface Province {
    name: string;
    districts: string[];
}

export const SRI_LANKA_PROVINCES: Province[] = [
    {
        name: "Western Province",
        districts: ["Colombo", "Gampaha", "Kalutara"]
    },
    {
        name: "Central Province",
        districts: ["Kandy", "Matale", "Nuwara Eliya"]
    },
    {
        name: "Southern Province",
        districts: ["Galle", "Matara", "Hambantota"]
    },
    {
        name: "North Western Province",
        districts: ["Kurunegala", "Puttalam"]
    },
    {
        name: "North Central Province",
        districts: ["Anuradhapura", "Polonnaruwa"]
    },
    {
        name: "Eastern Province",
        districts: ["Trincomalee", "Batticaloa", "Ampara"]
    },
    {
        name: "Northern Province",
        districts: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"]
    },
    {
        name: "Sabaragamuwa Province",
        districts: ["Kegalle", "Ratnapura"]
    },
    {
        name: "Uva Province",
        districts: ["Badulla", "Monaragala"]
    }
];

export const getAllDistricts = (): string[] => {
    return SRI_LANKA_PROVINCES.flatMap(province => province.districts);
};

export const getDistrictsByProvince = (provinceName: string): string[] => {
    const province = SRI_LANKA_PROVINCES.find(p => p.name === provinceName);
    return province ? province.districts : [];
};

export const formatLocation = (province: string, district: string): string => {
    return `${district}, ${province}`;
};

