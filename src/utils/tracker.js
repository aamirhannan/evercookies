export const handleSetEvercookie = (key, value) => {
    // First check if value already exists in any storage
    const existingCookie = document.cookie.split("; ").find(row => row.startsWith(key));
    const existingLocalStorage = localStorage.getItem(key);
    const existingSessionStorage = sessionStorage.getItem(key);

    // If value exists in any storage, don't override
    if (existingCookie || existingLocalStorage || existingSessionStorage) {
        console.log("Evercookie already exists for key:", key);
        return;
    }

    console.log("Setting Evercookie", key, value);

    // Standard HTTP Cookies
    document.cookie = `${key}=${value}; path=/; max-age=31536000`; // 1 year expiration

    // Local Storage
    localStorage.setItem(key, value);

    // Session Storage
    sessionStorage.setItem(key, value);

    // IndexedDB with existence check
    const openDB = () => {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open("evercookieDB", 2);

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("store")) {
                    db.createObjectStore("store");
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                try {
                    const transaction = db.transaction("store", "readwrite");
                    const store = transaction.objectStore("store");
                    
                    // Check if value exists in IndexedDB before setting
                    const getRequest = store.get(key);
                    getRequest.onsuccess = () => {
                        if (!getRequest.result) {
                            store.put(value, key);
                        }
                        resolve();
                    };
                } catch (error) {
                    // If store doesn't exist, close and delete the database, then retry with new version
                    db.close();
                    const deleteRequest = indexedDB.deleteDatabase("evercookieDB");
                    deleteRequest.onsuccess = () => {
                        // Recursive call to try again
                        openDB().then(resolve).catch(reject);
                    };
                }
            };
        });
    };

    // Call the database operation
    openDB().catch(error => console.error("IndexedDB error:", error));

    // WebRTC/HSTS (basic example using WebRTC fingerprinting)
    if (window.RTCPeerConnection) {
        const rtc = new RTCPeerConnection();
        rtc.createDataChannel("");
        rtc.createOffer()
            .then(offer => rtc.setLocalDescription(offer))
            .then(() => {
                const id = rtc.localDescription.sdp;
                localStorage.setItem(`webrtc-${key}`, id);
            });
    }

    // Canvas Fingerprinting
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "16px Arial";
    ctx.fillText(key + value, 10, 10);
    const canvasData = canvas.toDataURL();
    localStorage.setItem(`canvas-${key}`, canvasData);

    // History Caching (requires controlled scenarios)
    if (history.pushState) {
        history.pushState({ key }, "Evercookie State", `#${key}`);
    }

    // DNS Caching (requires server configuration)
    console.log(`Set DNS cache requires server involvement for key: ${key}`);

    // Flash Cookies (example for Flash; deprecated but included for reference)
    // Flash APIs are typically handled via Flash scripting and require embedding in HTML.

    // Silverlight Storage (example)
    console.log("Silverlight storage is deprecated and generally unavailable.");
};

export const handleGetEvercookie = async (key) => {
    const values = {};

    // Retrieve from HTTP Cookies
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find(row => row.startsWith(key));
    if (cookie) values.cookie = cookie.split("=")[1];

    // Retrieve from Local Storage
    values.localStorage = localStorage.getItem(key);

    // Retrieve from Session Storage
    values.sessionStorage = sessionStorage.getItem(key);

    // IndexedDB with proper error handling
    try {
        values.indexedDB = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open("evercookieDB", 2); // Same version as above

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("store")) {
                    db.createObjectStore("store");
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                try {
                    const transaction = db.transaction("store", "readonly");
                    const store = transaction.objectStore("store");
                    const getRequest = store.get(key);

                    getRequest.onsuccess = () => resolve(getRequest.result);
                    getRequest.onerror = () => reject(getRequest.error);
                } catch (error) {
                    resolve(null); // Return null if store doesn't exist
                }
            };
        });
    } catch (error) {
        console.error("IndexedDB error:", error);
        values.indexedDB = null;
    }

    // Filter out null values and get the most common value
    const validValues = Object.values(values).filter(value => value !== null);
    if (validValues.length === 0) return null;

    return validValues[0];
};
