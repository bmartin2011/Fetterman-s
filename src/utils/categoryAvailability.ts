import { Category, CategoryAvailabilityPeriod } from '../types';

/**
 * Check if a category is currently available based on its availability periods
 * @param category - The category to check
 * @param currentTime - Optional current time (defaults to now)
 * @returns Object with availability status and next available time
 */
export function isCategoryAvailable(category: Category, currentTime?: Date): {
  isAvailable: boolean;
  nextAvailableTime?: Date;
  currentPeriod?: CategoryAvailabilityPeriod;
  reason?: string;
} {
  // If no availability periods are defined, category is always available
  if (!category.availabilityPeriods || category.availabilityPeriods.length === 0) {
    return { isAvailable: true };
  }

  const now = currentTime || new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTimeString = formatTimeToHHMMSS(now);

  // Check each availability period
  for (const period of category.availabilityPeriods) {
    // If period has day restriction, check if it matches current day
    if (period.dayOfWeek && !isDayMatch(period.dayOfWeek, currentDay)) {
      continue;
    }

    // Check if current time falls within this period
    if (isTimeInRange(currentTimeString, period.startTime, period.endTime)) {
      return {
        isAvailable: true,
        currentPeriod: period
      };
    }
  }

  // Category is not currently available, find next available time
  const nextAvailableTime = findNextAvailableTime(category.availabilityPeriods, now);
  
  return {
    isAvailable: false,
    nextAvailableTime,
    reason: nextAvailableTime 
      ? `Available again at ${formatTime(nextAvailableTime)}`
      : 'No upcoming availability periods found'
  };
}

/**
 * Format Date object to HH:MM:SS string
 */
function formatTimeToHHMMSS(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

/**
 * Check if current day matches the period's day restriction
 */
function isDayMatch(dayOfWeek: string, currentDay: number): boolean {
  const dayMap: { [key: string]: number } = {
    'SUNDAY': 0,
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6,
    // Support abbreviated day names from Square API
    'SUN': 0,
    'MON': 1,
    'TUE': 2,
    'WED': 3,
    'THU': 4,
    'FRI': 5,
    'SAT': 6
  };

  return dayMap[dayOfWeek.toUpperCase()] === currentDay;
}

/**
 * Check if a time falls within a range
 */
function isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
  // Handle cases where end time is before start time (crosses midnight)
  if (endTime < startTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Find the next available time for a category
 */
function findNextAvailableTime(periods: CategoryAvailabilityPeriod[], currentTime: Date): Date | undefined {
  const now = new Date(currentTime);
  const currentDay = now.getDay();
  const currentTimeString = formatTimeToHHMMSS(now);

  // Look for availability periods in the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + dayOffset);
    const checkDay = checkDate.getDay();

    for (const period of periods) {
      // Skip if period has day restriction and doesn't match
      if (period.dayOfWeek && !isDayMatch(period.dayOfWeek, checkDay)) {
        continue;
      }

      // For today, only consider future times
      if (dayOffset === 0 && period.startTime <= currentTimeString) {
        continue;
      }

      // Create the next available datetime
      const nextAvailable = new Date(checkDate);
      const [hours, minutes, seconds] = period.startTime.split(':').map(Number);
      nextAvailable.setHours(hours, minutes, seconds, 0);

      return nextAvailable;
    }
  }

  return undefined;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Get availability status text for display
 */
export function getCategoryAvailabilityText(category: Category): string {
  const availability = isCategoryAvailable(category);
  
  if (availability.isAvailable) {
    if (availability.currentPeriod) {
      const endTime = new Date();
      const [hours, minutes] = availability.currentPeriod.endTime.split(':').map(Number);
      endTime.setHours(hours, minutes, 0, 0);
      return `Available until ${formatTime(endTime)}`;
    }
    return 'Available now';
  }
  
  return availability.reason || 'Currently unavailable';
}

/**
 * Filter categories to only show available ones
 */
export function filterAvailableCategories(categories: Category[]): Category[] {
  return categories.filter(category => isCategoryAvailable(category).isAvailable);
}

/**
 * Check if any products in a category are available
 */
export function isCategoryAccessible(category: Category): boolean {
  // If category has no availability restrictions, it's accessible
  if (!category.availabilityPeriods || category.availabilityPeriods.length === 0) {
    return true;
  }
  
  // Category is accessible if it's currently available
  return isCategoryAvailable(category).isAvailable;
}