import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// System fields that the CSV columns must map to
const SYSTEM_FIELDS = [
    { key: 'fullName', label: 'Name', required: true },
    { key: 'phoneNumber', label: 'Mobile Number', required: true },
    { key: 'city', label: 'City', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'zipCode', label: 'Zip Code', required: false },
    { key: 'state', label: 'State', required: false },
];

const NAVBAR_HEIGHT_PX = 66;


const SpreadsheetDetailsPage = ({ onNext, onPrevious, uploadedData, csvHeaders }) => {
    // uploadedData is expected to be { totalRecords, previewData, uploadedDataToken }

    // State to hold the mapping from CSV header to System Field
    const [mapping, setMapping] = useState({});
    const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [error, setError] = useState('');

    // Get CSV headers from uploaded data. Use the csvHeaders prop directly.
    const previewHeaders = csvHeaders || (uploadedData.previewData.length > 0 ? Object.keys(uploadedData.previewData[0]) : []);


    useEffect(() => {
        // Attempt automatic mapping on load based on common header names

        const initialMapping = {};

        // 1. Map system labels to normalized keys for easier matching
        const systemKeyMap = SYSTEM_FIELDS.reduce((acc, field) => {
            const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
            acc[normalizedLabel] = field.label;
            return acc;
        }, {});

        // 2. Iterate through CSV headers and find potential matches
        previewHeaders.forEach(csvHeader => {
            const normalizedCsvHeader = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');

            // Specific match checks (using normalized headers)
            if (normalizedCsvHeader.includes('name') && !initialMapping['Name']) {
                initialMapping['Name'] = csvHeader;
            }
            if ((normalizedCsvHeader.includes('mobile') || normalizedCsvHeader.includes('phone')) && !initialMapping['Mobile Number']) {
                initialMapping['Mobile Number'] = csvHeader;
            }
            if (normalizedCsvHeader.includes('city') && !initialMapping['City']) {
                initialMapping['City'] = csvHeader;
            }
            if (normalizedCsvHeader.includes('zip') && !initialMapping['Zip Code']) {
                initialMapping['Zip Code'] = csvHeader;
            }
            if (normalizedCsvHeader.includes('state') && !initialMapping['State']) {
                initialMapping['State'] = csvHeader;
            }
            if (normalizedCsvHeader.includes('address') && !initialMapping['Address']) {
                initialMapping['Address'] = csvHeader;
            }
        });

        // 3. Finalize mapping: ensure all system fields are present, defaulting to 'Select value'
        const finalMapping = {};
        SYSTEM_FIELDS.forEach(field => {
            finalMapping[field.label] = initialMapping[field.label] || 'Select value';
        });

        setMapping(finalMapping);

    }, [csvHeaders]);

    const handleMappingChange = (systemLabel, csvHeader) => {
        setMapping(prev => ({ ...prev, [systemLabel]: csvHeader }));
    };

    // 🟢 FIX 1: Missing 'validateMapping' function added back
    const validateMapping = () => {
        // Check if all required fields are mapped
        const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
        const unmappedFields = requiredFields.filter(f => mapping[f.label] === 'Select value' || mapping[f.label] === '');

        if (unmappedFields.length > 0) {
            setError(`Please map all required fields: ${unmappedFields.map(f => f.label).join(', ')}.`);
            return false;
        }
        setError('');
        return true;
    };

    const handleAutoFill = () => {
        // Since we already auto-filled on load, this button can just ensure required fields are addressed.
        validateMapping();
    };

    // 🟢 FIX 2: Missing 'handleNextStep' function added back
    const handleNextStep = () => {
        // Validation check before proceeding
        if (validateMapping()) {
            // Pass the final data token and mapping to the next step (Confirm)
            onNext({ uploadedDataToken: uploadedData.uploadedDataToken, mapping });
        }
    };

    // Simplified Pagination logic for preview
    const totalPages = Math.ceil(uploadedData.previewData.length / recordsPerPage);
    const startIndex = (currentPreviewPage - 1) * recordsPerPage;
    const currentPreviewData = uploadedData.previewData.slice(startIndex, startIndex + recordsPerPage);

    // Calculate display range for the table footer
    const currentRecordsDisplayed = Math.min(startIndex + recordsPerPage, uploadedData.totalRecords);


    return (
        // 🟢 FIX: Added height, overflow, and position compensation for fixed Navbar
        <div
            className="p-8 bg-gray-50 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, // 66px (Navbar) + 32px (p-8)
                marginTop: `-${NAVBAR_HEIGHT_PX}px` // Pull up under the navbar
            }}
        >
            <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Spreadsheet Details</h2>

                {/* Mapping Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-gray-100 rounded-lg bg-white shadow-sm mb-8">
                    {SYSTEM_FIELDS.map(field => (
                        <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <select
                                value={mapping[field.label] || 'Select value'}
                                onChange={(e) => handleMappingChange(field.label, e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white mt-1"
                            >
                                <option value="Select value" disabled>Select value</option>
                                {/* Option to skip mapping */}
                                <option value="">(Skip this field)</option>
                                {/* Use previewHeaders (derived from csvHeaders prop) */}
                                {previewHeaders.map(header => (
                                    <option key={header} value={header}>{header}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={handleAutoFill}
                        className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
                    >
                        Auto Fill
                    </button>
                </div>


                {/* Current Sheet Details & Preview (Unchanged) */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Sheet Details</h3>

                    {error && (
                        <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-400 rounded-lg text-sm font-medium flex items-center">
                            <ExclamationTriangleIcon className='w-5 h-5 mr-2' /> {error}
                        </div>
                    )}

                    <div className="p-3 mb-6 bg-green-100 text-green-700 border border-green-400 rounded-lg flex items-center text-sm font-medium">
                        <CheckCircleIcon className="w-5 h-5 mr-2" /> Ready to import: {uploadedData.totalRecords} contacts found in CSV file
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-4">CSV Preview (First {currentPreviewData.length} entries)</h3>

                    {/* CSV Preview Table (Fixed height scrolling area) */}
                    <div className="overflow-x-auto overflow-y-auto border rounded-lg max-h-96"> {/* max-h-96 added */}
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10"> {/* Sticky header for fixed height scrolling */}
                                <tr>
                                    {previewHeaders.map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs uppercase text-gray-600">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {currentPreviewData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {previewHeaders.map(header => (
                                            <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row[header] || '—'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">Showing {startIndex + 1} to {currentRecordsDisplayed} of {uploadedData.totalRecords} entries</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm">Rows per page:</span>
                            <select
                                value={recordsPerPage}
                                onChange={(e) => setRecordsPerPage(parseInt(e.target.value))}
                                className='border rounded-lg text-sm p-1'
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <button
                                onClick={() => setCurrentPreviewPage(p => p - 1)}
                                disabled={currentPreviewPage === 1}
                                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 flex items-center"
                            >
                                <ChevronLeftIcon className='w-4 h-4' />
                            </button>
                            <span className="text-sm">Page {currentPreviewPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPreviewPage(p => p + 1)}
                                disabled={currentPreviewPage === totalPages}
                                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 flex items-center"
                            >
                                <ChevronRightIcon className='w-4 h-4' />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <button
                        onClick={onPrevious}
                        className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition flex items-center"
                    >
                        <ChevronLeftIcon className='w-5 h-5 mr-2' /> Previous
                    </button>
                    <button
                        onClick={handleNextStep}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center"
                    >
                        Next Step <ChevronRightIcon className='w-5 h-5 ml-2' />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpreadsheetDetailsPage;