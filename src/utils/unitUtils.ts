import { MeasurementUnit, MEASUREMENT_UNITS, SquareMeasurementUnit } from '../types';
import { squareService } from '../services/squareService';

// Convert MEASUREMENT_UNITS object to array for easier searching
const MEASUREMENT_UNITS_ARRAY = Object.values(MEASUREMENT_UNITS);

/**
 * Format a unit quantity with its measurement unit
 * @param quantity - The numeric quantity
 * @param unit - The measurement unit
 * @returns Formatted string (e.g., "8 oz", "1.5 lbs")
 */
export function formatUnit(quantity: number, unit?: MeasurementUnit): string {
  if (!unit) {
    return quantity.toString();
  }
  
  // Handle plural forms
  const displayName = quantity === 1 ? unit.name : unit.name + 's';
  const abbreviation = unit.abbreviation;
  
  // Use abbreviation for common units, full name for others
  const commonAbbreviations = ['oz', 'lb', 'fl oz', 'g', 'kg', 'ml', 'l'];
  const useAbbreviation = commonAbbreviations.includes(abbreviation.toLowerCase());
  
  const unitDisplay = useAbbreviation ? abbreviation : displayName.toLowerCase();
  
  // Format quantity to remove unnecessary decimals
  const formattedQuantity = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  
  return `${formattedQuantity} ${unitDisplay}`;
}

/**
 * Convert between different measurement units of the same type
 * @param quantity - The quantity to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @returns Converted quantity
 */
export function convertUnit(quantity: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number {
  if (fromUnit.type !== toUnit.type) {
    throw new Error(`Cannot convert between different unit types: ${fromUnit.type} to ${toUnit.type}`);
  }
  
  // Weight conversions
  if (fromUnit.type === 'weight') {
    const toOunces = (qty: number, unit: MeasurementUnit): number => {
      switch (unit.abbreviation.toLowerCase()) {
        case 'oz': return qty;
        case 'lb': return qty * 16;
        case 'g': return qty * 0.035274;
        case 'kg': return qty * 35.274;
        default: return qty;
      }
    };
    
    const fromOunces = (qty: number, unit: MeasurementUnit): number => {
      switch (unit.abbreviation.toLowerCase()) {
        case 'oz': return qty;
        case 'lb': return qty / 16;
        case 'g': return qty / 0.035274;
        case 'kg': return qty / 35.274;
        default: return qty;
      }
    };
    
    const ounces = toOunces(quantity, fromUnit);
    return fromOunces(ounces, toUnit);
  }
  
  // Volume conversions
  if (fromUnit.type === 'volume') {
    const toFlOunces = (qty: number, unit: MeasurementUnit): number => {
      switch (unit.abbreviation.toLowerCase()) {
        case 'fl oz': return qty;
        case 'ml': return qty * 0.033814;
        case 'l': return qty * 33.814;
        case 'cup': return qty * 8;
        case 'pt': return qty * 16;
        case 'qt': return qty * 32;
        case 'gal': return qty * 128;
        default: return qty;
      }
    };
    
    const fromFlOunces = (qty: number, unit: MeasurementUnit): number => {
      switch (unit.abbreviation.toLowerCase()) {
        case 'fl oz': return qty;
        case 'ml': return qty / 0.033814;
        case 'l': return qty / 33.814;
        case 'cup': return qty / 8;
        case 'pt': return qty / 16;
        case 'qt': return qty / 32;
        case 'gal': return qty / 128;
        default: return qty;
      }
    };
    
    const flOunces = toFlOunces(quantity, fromUnit);
    return fromFlOunces(flOunces, toUnit);
  }
  
  // If no conversion is needed or supported, return original quantity
  return quantity;
}

/**
 * Get the best display unit for a given quantity and unit type
 * @param quantity - The quantity
 * @param unitType - The type of unit (weight, volume, etc.)
 * @returns The most appropriate unit for display
 */
export function getBestDisplayUnit(quantity: number, unitType: string): MeasurementUnit {
  const unitsOfType = MEASUREMENT_UNITS_ARRAY.filter(u => u.type === unitType);
  
  if (unitType === 'weight') {
    // Use pounds for quantities >= 1 pound (16 oz)
    if (quantity >= 16) {
      return MEASUREMENT_UNITS_ARRAY.find(u => u.abbreviation === 'lb') || unitsOfType[0];
    }
    // Use ounces for smaller quantities
    return MEASUREMENT_UNITS_ARRAY.find(u => u.abbreviation === 'oz') || unitsOfType[0];
  }
  
  if (unitType === 'volume') {
    // Use fluid ounces as default for volume
    return MEASUREMENT_UNITS_ARRAY.find(u => u.abbreviation === 'fl oz') || unitsOfType[0];
  }
  
  // Return first unit of the type as default
  return unitsOfType[0] || MEASUREMENT_UNITS_ARRAY[0];
}

/**
 * Parse unit information from a product name or description
 * @param text - The text to parse
 * @returns Object with quantity and unit if found
 */
export function parseUnitFromText(text: string): { quantity: number; unit: MeasurementUnit } | null {
  const lowerText = text.toLowerCase();
  
  // Common patterns for units
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*oz(?:s|\b)/, unit: 'oz' },
    { regex: /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)\b/, unit: 'lb' },
    { regex: /(\d+(?:\.\d+)?)\s*fl\s*oz(?:s|\b)/, unit: 'fl oz' },
    { regex: /(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/, unit: 'g' },
    { regex: /(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)\b/, unit: 'kg' },
    { regex: /(\d+(?:\.\d+)?)\s*(?:ml|milliliter|milliliters)\b/, unit: 'ml' },
    { regex: /(\d+(?:\.\d+)?)\s*(?:l|liter|liters)\b/, unit: 'l' }
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern.regex);
    if (match) {
      const quantity = parseFloat(match[1]);
      const unit = MEASUREMENT_UNITS_ARRAY.find(u => u.abbreviation === pattern.unit);
      if (unit) {
        return { quantity, unit };
      }
    }
  }
  
  return null;
}

/**
 * Calculate price per unit for comparison
 * @param price - The total price
 * @param quantity - The quantity
 * @param unit - The measurement unit
 * @returns Price per unit string
 */
export function calculatePricePerUnit(price: number, quantity: number, unit?: MeasurementUnit): string {
  if (!unit || quantity <= 0) {
    return '';
  }
  
  const pricePerUnit = price / quantity;
  const formattedPrice = pricePerUnit.toFixed(2);
  
  return `$${formattedPrice}/${unit.abbreviation}`;
}

/**
 * Get all available measurement units from Square and merge with local units
 * @returns Combined array of measurement units
 */
export async function getAllMeasurementUnits(): Promise<MeasurementUnit[]> {
  try {
    const squareUnits = await squareService.getMeasurementUnits();
    const convertedSquareUnits = squareService.convertSquareUnitsToMeasurementUnits(squareUnits);
    
    // Merge with local units, avoiding duplicates
    const localUnits = Object.values(MEASUREMENT_UNITS);
    const allUnits = [...localUnits];
    
    convertedSquareUnits.forEach(squareUnit => {
      const exists = allUnits.find(unit => 
        unit.abbreviation.toLowerCase() === squareUnit.abbreviation.toLowerCase() ||
        unit.name.toLowerCase() === squareUnit.name.toLowerCase()
      );
      
      if (!exists) {
        allUnits.push(squareUnit);
      }
    });
    
    return allUnits;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching Square measurement units:', error);
    }
    // Fallback to local units only
    return Object.values(MEASUREMENT_UNITS);
  }
}

/**
 * Find a measurement unit by Square unit ID
 * @param squareUnitId - The Square measurement unit ID
 * @returns The corresponding MeasurementUnit or null
 */
export async function findMeasurementUnitBySquareId(squareUnitId: string): Promise<MeasurementUnit | null> {
  try {
    const squareUnits = await squareService.getMeasurementUnits();
    const squareUnit = squareUnits.find(unit => unit.id === squareUnitId);
    
    if (squareUnit) {
      const convertedUnits = squareService.convertSquareUnitsToMeasurementUnits([squareUnit]);
      return convertedUnits[0] || null;
    }
    
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error finding Square measurement unit:', error);
    }
    return null;
  }
}

/**
 * Get measurement units filtered by type
 * @param unitType - The type of units to filter by
 * @returns Array of measurement units of the specified type
 */
export async function getMeasurementUnitsByType(unitType: 'weight' | 'volume' | 'length' | 'area' | 'generic'): Promise<MeasurementUnit[]> {
  const allUnits = await getAllMeasurementUnits();
  return allUnits.filter(unit => unit.type === unitType);
}

/**
 * Convert Square measurement unit to our MeasurementUnit format
 * @param squareUnit - The Square measurement unit
 * @returns Converted MeasurementUnit
 */
export function convertSquareUnitToMeasurementUnit(squareUnit: SquareMeasurementUnit): MeasurementUnit {
  return squareService.convertSquareUnitsToMeasurementUnits([squareUnit])[0];
}