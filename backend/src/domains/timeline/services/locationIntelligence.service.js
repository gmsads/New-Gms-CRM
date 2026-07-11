/**
 * LocationIntelligenceService
 * Converts raw GPS coordinates into meaningful categorized locations (`Client Office`, `Office`, `Restaurant`, `Petrol Pump`, etc.)
 * by matching against registered CRM Client Visits, Branch locations, and reverse geocoded POIs.
 */

const Visit = require('../../field/visits/visit.model');
const User = require('../../../domains/users/user.model'); // or User model path
const movementDetector = require('./movementDetector.service');

class LocationIntelligenceService {
  /**
   * Categorize coordinate location and reverse geocode POI details
   */
  async categorizeAndResolveLocation({ userId, latitude, longitude, addressHint, dateString }) {
    if (!latitude || !longitude) {
      return {
        category: 'Unknown',
        businessName: addressHint || 'Unknown Location',
        address: addressHint || '',
        isVerifiedClientSite: false
      };
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    // 1. Check if coordinates match an assigned client Visit for today or nearby client
    try {
      const todayStart = new Date(dateString || new Date().toISOString().split('T')[0]);
      const todayEnd = new Date(todayStart.getTime() + 86400000);

      const visits = await Visit.find({
        assignedTo: userId,
        scheduledDate: { $gte: todayStart, $lte: todayEnd }
      }).select('clientName checkIn checkOut status address').lean();

      for (const v of visits) {
        if (v.checkIn && v.checkIn.coords && v.checkIn.coords.latitude) {
          const distKm = movementDetector.calculateDistanceKm(
            lat,
            lng,
            Number(v.checkIn.coords.latitude),
            Number(v.checkIn.coords.longitude)
          );
          if (distKm <= 0.150) { // within 150 meters of checked-in client visit
            return {
              category: 'Client Office',
              businessName: v.clientName || 'Client Location',
              address: v.address || addressHint || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              isVerifiedClientSite: true,
              matchedVisitId: v._id
            };
          }
        }
      }
    } catch (err) {
      console.warn('LocationIntelligence visit match warning:', err.message);
    }

    // 2. Check keyword/address hints or POI names from locationName/addressHint
    if (addressHint) {
      const lower = addressHint.toLowerCase();
      if (lower.includes('client') || lower.includes('enterprise') || lower.includes('industr') || lower.includes('pvt ltd') || lower.includes('company')) {
        return {
          category: 'Client Office',
          businessName: addressHint.split(',')[0] || 'Client Business',
          address: addressHint,
          isVerifiedClientSite: false
        };
      }
      if (lower.includes('office') || lower.includes('headquarter') || lower.includes('branch') || lower.includes('agency crm')) {
        return {
          category: 'Office',
          businessName: addressHint.split(',')[0] || 'Office Premises',
          address: addressHint,
          isVerifiedClientSite: false
        };
      }
      if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('hotel') || lower.includes('food') || lower.includes('tea') || lower.includes('dhaba')) {
        return {
          category: 'Restaurant',
          businessName: addressHint.split(',')[0] || 'Restaurant / Cafe',
          address: addressHint,
          isVerifiedClientSite: false
        };
      }
      if (lower.includes('petrol') || lower.includes('fuel') || lower.includes('pump') || lower.includes('hp') || lower.includes('ioc') || lower.includes('bharat petroleum')) {
        return {
          category: 'Petrol Pump',
          businessName: addressHint.split(',')[0] || 'Petrol Pump',
          address: addressHint,
          isVerifiedClientSite: false
        };
      }
      if (lower.includes('bank') || lower.includes('atm') || lower.includes('hdfc') || lower.includes('sbi') || lower.includes('icici')) {
        return {
          category: 'Bank',
          businessName: addressHint.split(',')[0] || 'Bank / ATM',
          address: addressHint,
          isVerifiedClientSite: false
        };
      }
      if (lower.includes('mall') || lower.includes('plaza') || lower.includes('center') || lower.includes('complex')) {
        return {
          category: 'Mall',
          businessName: addressHint.split(',')[0] || 'Commercial Complex / Mall',
          address: addressHint,
          isVerifiedClientSite: false
        };
      }
    }

    // 3. Check time-of-day heuristic: between 13:00 - 14:30 and stationary -> likely Lunch Break
    const hour = new Date().getHours();
    if (hour >= 13 && hour <= 14) {
      return {
        category: 'Restaurant',
        businessName: addressHint ? addressHint.split(',')[0] : 'Lunch / Break Stop',
        address: addressHint || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        isVerifiedClientSite: false
      };
    }

    // Default Unknown
    return {
      category: 'Unknown',
      businessName: addressHint ? addressHint.split(',')[0] : `Stop at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      address: addressHint || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      isVerifiedClientSite: false
    };
  }
}

module.exports = new LocationIntelligenceService();
