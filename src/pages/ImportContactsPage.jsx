import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CloudArrowUpIcon, DocumentChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, Bars3Icon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
// Import Step 2 Component
import SpreadsheetDetailsPage from './SpreadsheetDetailsPage';

const API_BASE_URL = 'http://localhost:3001/api/contacts';
const NAVBAR_HEIGHT_PX = 66;

// --- Step Indicator Component ---
const StepIndicator = ({ step }) => {
    const steps = [
        { id: 1, name: 'Upload File', icon: CloudArrowUpIcon },
        { id: 2, name: 'Spreadsheet Details', icon: DocumentChartBarIcon },
        { id: 3, name: 'Confirm', icon: CheckCircleIcon },
    ];

    return (
        <div className="flex justify-between items-center w-full max-w-lg mx-auto mb-10">
            {steps.map((item, index) => (
                <React.Fragment key={item.id}>
                    <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${item.id === step
                            ? 'bg-indigo-600 text-white shadow-xl'
                            : item.id < step
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <p className={`mt-2 text-sm font-medium whitespace-nowrap ${item.id <= step ? 'text-gray-800' : 'text-gray-500'}`}>{item.name}</p>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-auto border-t-2 transition-colors duration-300 ${item.id < step ? 'border-green-500' : 'border-gray-200'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

// --- Step 1: Upload File Component ---
const UploadFileStep = ({ uploadedData, onUploadSuccess, isSubmitting, setIsSubmitting }) => {
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadError('');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setUploadError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadError('Please select a file.');
            return;
        }

        setIsSubmitting(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('contactFile', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/import/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                onUploadSuccess(response.data);
            } else {
                setUploadError(response.data.message || 'File validation failed.');
            }
        } catch (error) {
            setUploadError(error.response?.data?.message || 'Server upload failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.open(`${API_BASE_URL}/download-template`, '_blank');
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition flex items-center"
                >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    DOWNLOAD CSV FILE
                </button>
            </div>

            <div className="bg-white shadow-2xl rounded-lg p-8 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload File (<span className="text-red-500">*Please select CSV file</span>)</h2>

                {uploadError && (
                    <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-400 rounded-lg text-sm font-medium">
                        {uploadError}
                    </div>
                )}

                {/* Drag & Drop Area */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors duration-300 ${dragActive ? 'border-indigo-500 bg-indigo-50' : (file ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50')}`}
                >
                    <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium text-gray-600">Drag & drop a CSV file here or click to select</p>
                    <p className="text-sm mt-1 text-gray-500">Accepted format: CSV</p>
                    {file && <p className="mt-2 text-sm text-green-700 font-medium">File selected: {file.name}</p>}
                </div>

                {/* Browse Button and Next */}
                <div className="flex justify-end mt-6 space-x-4">
                    <label htmlFor="csv-upload" className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                        Browse
                        <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button
                        onClick={handleUpload}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center disabled:bg-indigo-400"
                        disabled={isSubmitting || !file}
                    >
                        {isSubmitting ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <ChevronRightIcon className="w-5 h-5 mr-2" />}
                        {isSubmitting ? 'Uploading...' : 'Next'}
                    </button>
                </div>
            </div>
        </>
    );
};

// --- Step 3: Confirm Import Component ---
const ConfirmImportStep = ({ onPrevious, finalImportData, setIsImporting, isImporting, onImportComplete }) => {

    const { uploadedDataToken, mapping } = finalImportData;
    const [targetGroup, setTargetGroup] = useState('Imported Contacts');
    const [importError, setImportError] = useState('');

    const totalRecordsText = uploadedDataToken
        ? atob(uploadedDataToken).substring(0, 50) + '...'
        : '0';

    const handleFinalImport = async () => {
        setIsImporting(true);
        setImportError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/import/final-import`, {
                uploadedDataToken,
                targetGroup,
                mapping
            });

            if (response.data.success) {
                onImportComplete(response.data.importedCount);
            } else {
                setImportError(response.data.message || 'Final import failed.');
            }
        } catch (error) {
            let message = 'Server import failed. Check network connection.';
            if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error.response?.status === 500 && error.response?.data?.code === 11000) {
                message = "Import Failed: Duplicate contact number(s) found. Check your CSV file.";
            }
            setImportError(message);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="bg-white shadow-2xl rounded-lg p-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Confirm Import Details</h2>

            {importError && (
                <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-400 rounded-lg text-sm font-medium">
                    {importError}
                </div>
            )}

            <div className='p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-6'>
                <p className='font-semibold text-indigo-700 mb-2'>Summary:</p>
                <p className='text-sm'>Total Records Found: {uploadedDataToken ? 'Validated' : 'N/A'}</p>
                <p className='text-sm'>Mapped Fields: {Object.keys(mapping).filter(k => mapping[k] !== 'Select value').length}</p>
            </div>

            {/* Target Group Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Group Name</label>
                <input
                    type="text"
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    placeholder="e.g., Q4 Leads, Imported Contacts"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                />
            </div>

            <div className="flex justify-between mt-10">
                <button
                    onClick={onPrevious}
                    className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
                    disabled={isImporting}
                >
                    <ChevronLeftIcon className='w-5 h-5 mr-2' /> Previous
                </button>
                <button
                    onClick={handleFinalImport}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center disabled:bg-indigo-400"
                    disabled={isImporting}
                >
                    {isImporting ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                    {isImporting ? 'Importing...' : 'Start Import'}
                </button>
            </div>
        </div>
    );
};

// --- MAIN CONTROLLER COMPONENT ---
const ImportContactsPage = () => {
    const [step, setStep] = useState(1);
    const [uploadedData, setUploadedData] = useState(null);
    const [finalImportData, setFinalImportData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importCompleteCount, setImportCompleteCount] = useState(null);

    const handleUploadSuccess = (data) => {
        setUploadedData(data);
        const csvHeaders = data.previewData.length > 0 ? Object.keys(data.previewData[0]) : [];
        setFinalImportData({ csvHeaders });
        setStep(2);
    };

    const handleMappingComplete = ({ uploadedDataToken, mapping }) => {
        setFinalImportData({ uploadedDataToken, mapping });
        setStep(3);
    };

    const renderContent = () => {
        if (importCompleteCount !== null) {
            return (
                <div className="bg-white shadow-2xl rounded-lg p-10 text-center border border-gray-200">
                    <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <h2 className="text-2xl font-bold text-gray-800">Import Successful!</h2>
                    <p className="text-gray-600 mt-2">Successfully imported {importCompleteCount} contacts into your system.</p>
                    <button
                        onClick={() => { setImportCompleteCount(null); setStep(1); setUploadedData(null); }}
                        className="mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                        Start New Import
                    </button>
                </div>
            );
        }

        switch (step) {
            case 1:
                return (
                    <UploadFileStep
                        uploadedData={uploadedData}
                        onUploadSuccess={handleUploadSuccess}
                        isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting}
                    />
                );
            case 2:
                if (!finalImportData || !finalImportData.csvHeaders) {
                    return (
                        <div className="bg-white shadow-2xl rounded-lg p-10 text-center border border-gray-200">
                            <ArrowPathIcon className="w-8 h-8 mx-auto mb-4 animate-spin text-indigo-500" />
                            <p>Preparing spreadsheet details...</p>
                            <button onClick={() => setStep(1)} className='mt-4 text-sm text-indigo-600'>Back to Upload</button>
                        </div>
                    );
                }
                return (
                    <SpreadsheetDetailsPage
                        onNext={handleMappingComplete}
                        onPrevious={() => setStep(1)}
                        uploadedData={uploadedData}
                        csvHeaders={finalImportData.csvHeaders}
                    />
                );
            case 3:
                if (!finalImportData || !finalImportData.mapping) {
                    return (
                        <div className="bg-white shadow-2xl rounded-lg p-10 text-center border border-gray-200">
                            <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-4 text-red-500" />
                            <p>Mapping data missing. Please retry Step 2.</p>
                            <button onClick={() => setStep(2)} className='mt-4 text-sm text-indigo-600'>Back to Mapping</button>
                        </div>
                    );
                }
                return (
                    <ConfirmImportStep
                        onPrevious={() => setStep(2)}
                        finalImportData={finalImportData}
                        isImporting={isSubmitting}
                        setIsImporting={setIsSubmitting}
                        onImportComplete={setImportCompleteCount}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="p-8 bg-gray-50 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Import Contacts</h1>
            <p className="text-gray-500 mb-6 border-b pb-4 text-sm">Note: Maximum 5,000 contacts per day. Daily limit resets every 24 hours.</p>

            {/* Step Indicator */}
            <StepIndicator step={step} />

            {/* Content based on Step */}
            {renderContent()}

            {/* Floating Button */}
            <button className="fixed bottom-8 right-8 bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition">
                <Bars3Icon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default ImportContactsPage;
