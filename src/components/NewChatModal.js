// src/components/NewChatModal.js (एक नया कंपोनेंट बनाएँ)

const NewChatModal = ({ onClose, onStartChat, newPhoneNumber, setNewPhoneNumber }) => {
    // ... UI (Tailwind CSS) का उपयोग करके Modal डिज़ाइन करें ...

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation करें (जैसे: क्या नंबर मान्य है)
        if (newPhoneNumber.length > 8) {
            onStartChat(newPhoneNumber);
            onClose();
        } else {
            alert("Please enter a valid phone number with country code.");
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-80">
                <h3 className="text-lg font-bold mb-4">Start New Chat</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="tel"
                        value={newPhoneNumber}
                        onChange={(e) => setNewPhoneNumber(e.target.value)}
                        placeholder="Enter Phone Number (e.g., +919876543210)"
                        className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                        required
                    />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Start Chat</button>
                    </div>
                </form>
            </div>
        </div>
    );
};