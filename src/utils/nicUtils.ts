/**
 * Details extracted from NIC
 */
export interface NicDetails {
    dateOfBirth: Date;
    gender: 'Male' | 'Female';
    type: 'Old' | 'New';
}

/**
 * Extracts Date of Birth and Gender from a Sri Lankan NIC number.
 * Supports both Old (9 digits + V/X) and New (12 digits) formats.
 * 
 * @param nicString The NIC number string
 * @returns NicDetails object or null if invalid
 */
export const extractNicDetails = (nicString: string): NicDetails | null => {
    if (!nicString) return null;
    const nic = nicString.trim().toUpperCase();

    let year = 0;
    let dayOfYear = 0;
    let type: 'Old' | 'New' = 'New';

    // Check Format
    if (nic.length === 10) {
        // Old Format: 9 digits + letter (e.g., 911040333V)
        const digits = nic.substring(0, 9);
        if (!/^\d+$/.test(digits)) return null;

        year = 1900 + parseInt(digits.substring(0, 2));
        dayOfYear = parseInt(digits.substring(2, 5));
        type = 'Old';

    } else if (nic.length === 12) {
        // New Format: 12 digits (e.g., 199110403333)
        if (!/^\d+$/.test(nic)) return null;

        year = parseInt(nic.substring(0, 4));
        dayOfYear = parseInt(nic.substring(4, 7));
        type = 'New';
    } else {
        return null;
    }

    // Determine Gender (Male < 500, Female >= 500)
    let gender: 'Male' | 'Female' = 'Male';
    if (dayOfYear > 500) {
        gender = 'Female';
        dayOfYear -= 500;
    }

    // Validate Day of Year (1-366)
    if (dayOfYear < 1 || dayOfYear > 366) {
        return null;
    }

    // Calculate Date of Birth
    const dateOfBirth = getDateFromDayOfYear(year, dayOfYear);

    return {
        dateOfBirth,
        gender,
        type
    };
};

/**
 * Helper to convert Day of Year to JS Date object
 */
const getDateFromDayOfYear = (year: number, dayOfYear: number): Date => {
    const date = new Date(year, 0); // Start at Jan 1st
    date.setDate(dayOfYear); // Add days (Date object handles leap years automatically mostly)
    return date;
};
