import { MeasurementUnit, MEASUREMENT_UNITS } from '../types';

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