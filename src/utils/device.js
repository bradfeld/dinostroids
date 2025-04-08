/**
 * Checks if the current device is a mobile phone (iPhone or Android)
 * @returns {boolean} True if the device is a mobile phone
 */
export function isMobilePhone() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Regular expressions to match mobile devices
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    
    return mobileRegex.test(userAgent.toLowerCase());
} 