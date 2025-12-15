import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import {
    CheckCircleIcon,
    Cog6ToothIcon,
    ArrowsRightLeftIcon,
    WrenchScrewdriverIcon,
    CreditCardIcon,
    DevicePhoneMobileIcon,
    DocumentChartBarIcon,
    CalendarDaysIcon,
    PlusIcon,
    ChartBarIcon,
    XMarkIcon,
    PhoneIcon,
    MagnifyingGlassIcon,
    BoltIcon,
    QuestionMarkCircleIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import {
    ClockIcon,
    CurrencyDollarIcon,
    SparklesIcon
} from '@heroicons/react/24/solid';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const API_BASE_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001');

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51QO8q2P9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9');

const TabNav = ({ activeTab, setActiveTab, isDark }) => {
    const tabs = [
        { id: 'billing', name: 'Active Subscriptions', icon: DocumentChartBarIcon },
        { id: 'details', name: 'System Details', icon: WrenchScrewdriverIcon },
        { id: 'guide', name: 'Guide & Help', icon: QuestionMarkCircleIcon },
    ];

    return (
        <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-300'} mb-6`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 ${activeTab === tab.id
                        ? isDark
                            ? 'text-indigo-400 border-indigo-500 bg-gray-800/50'
                            : 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                        : isDark
                            ? 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-800/30'
                            : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}`} />
                    {tab.name}
                </button>
            ))}
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, isDark }) => (
    <div className={`rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 to-purple-600"></div>
        <div className="p-5 flex items-center justify-between">
            <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
                <h3 className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
                {subtitle && <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
        </div>
    </div>
);

const FeatureCard = ({ icon: Icon, title, description, colorClass, isDark }) => (
    <div className={`p-5 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'} flex flex-col justify-between transition-all duration-200`}>
        <div className="flex items-center mb-3">
            <div className={`p-2.5 rounded-lg ${colorClass} ${isDark ? 'bg-opacity-10' : 'bg-opacity-20'} mr-3`}>
                <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
    </div>
);

// Generic Payment Form Component
const PaymentForm = ({ amount, onSuccess, buttonLabel, isDark }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        try {
            // 1. Create Payment Intent
            const { data } = await axios.post(`${API_BASE_URL}/stripe/create-payment-intent`, {
                amount,
                phoneNumber: 'DIRECT_PAYMENT'
            });

            // 2. Confirm Card Payment
            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
            });

            if (result.error) {
                setError(result.error.message);
            } else if (result.paymentIntent.status === 'succeeded') {
                onSuccess();
            }
        } catch (err) {
            console.error("Payment failed", err);
            setError(err.response?.data?.message || err.message || "Payment failed");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: isDark ? '#fff' : '#424770',
                            '::placeholder': { color: isDark ? '#aab7c4' : '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                    },
                }} />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold disabled:bg-gray-400 text-sm transition-all shadow-lg flex justify-center items-center gap-2"
            >
                {processing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCardIcon className="w-5 h-5" />
                        {buttonLabel || `Pay $${amount}`}
                    </>
                )}
            </button>
        </form>
    );
};

const BuyNumberModal = ({ isOpen, closeModal, onBuySuccess, isDark }) => {
    const [areaCode, setAreaCode] = useState('');
    const [availableNumbers, setAvailableNumbers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState(null); // Number selected for purchase

    const searchNumbers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/twilio/numbers/search`, { params: { areaCode } });
            setAvailableNumbers(res.data);
        } catch (err) {
            console.error("Search failed", err);
            alert("Failed to search numbers.");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        try {
            await axios.post(`${API_BASE_URL}/twilio/numbers/buy`, { phoneNumber: selectedNumber.phoneNumber });
            onBuySuccess();
            closeModal();
            setSelectedNumber(null);
        } catch (err) {
            console.error("Buy failed", err);
            alert("Payment successful, but failed to assign number. Please contact support.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-2xl`}>
                <header className={`p-5 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-t-xl flex justify-between items-center`}>
                    <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedNumber ? (
                            <>
                                <button onClick={() => setSelectedNumber(null)} className="mr-2 hover:bg-gray-700 rounded-full p-1"><ArrowLeftIcon className="w-5 h-5" /></button>
                                Complete Purchase
                            </>
                        ) : (
                            <>
                                <PlusIcon className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                Buy New Number
                            </>
                        )}
                    </h2>
                    <button onClick={closeModal} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'} transition-colors`}>
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-5 flex-1 overflow-y-auto">
                    {selectedNumber ? (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Selected Number</p>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedNumber.friendlyName}</p>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Cost: <span className="font-bold text-emerald-500">$1.15</span></p>
                            </div>

                            <div>
                                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Enter Card Details</h3>
                                <PaymentForm
                                    amount={1.15}
                                    onSuccess={handlePaymentSuccess}
                                    buttonLabel="Pay $1.15 & Activate"
                                    isDark={isDark}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-3 mb-6">
                                <input
                                    type="text"
                                    placeholder="Area Code (e.g. 415)"
                                    value={areaCode}
                                    onChange={(e) => setAreaCode(e.target.value)}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-indigo-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-600'} focus:ring-2 outline-none text-sm transition-all`}
                                />
                                <button
                                    onClick={searchNumbers}
                                    disabled={loading}
                                    className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300'}`}
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {availableNumbers.map((num) => (
                                    <div key={num.phoneNumber} className={`flex justify-between items-center p-4 border rounded-lg transition-all ${isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <div>
                                            <p className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{num.friendlyName}</p>
                                            <p className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{num.phoneNumber} • {num.price}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedNumber(num)}
                                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-all"
                                        >
                                            Select
                                        </button>
                                    </div>
                                ))}
                                {availableNumbers.length === 0 && !loading && (
                                    <div className="text-center py-10">
                                        <MagnifyingGlassIcon className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Enter an area code to search.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const RechargeModal = ({ isOpen, closeModal, phoneNumber, onRechargeSuccess, isDark }) => {
    const [selectedPlan, setSelectedPlan] = useState('basic');
    const [step, setStep] = useState('plan'); // 'plan' or 'payment'

    const plans = [
        { id: 'basic', name: 'Basic', amount: 5, description: 'Light usage' },
        { id: 'pro', name: 'Pro', amount: 15, description: 'Active businesses' },
        { id: 'max', name: 'Max', amount: 50, description: 'High volume' },
    ];

    const selectedPlanDetails = plans.find(p => p.id === selectedPlan);

    const handlePaymentSuccess = async () => {
        try {
            await axios.post(`${API_BASE_URL}/twilio/numbers/recharge`, {
                phoneNumber,
                amount: selectedPlanDetails.amount
            });
            alert(`✅ Recharge Successful!\n\nAmount: $${selectedPlanDetails.amount}`);
            onRechargeSuccess();
            closeModal();
            setStep('plan');
        } catch (err) {
            console.error("Recharge failed", err);
            alert("Payment successful, but recharge failed. Please contact support.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`rounded-xl max-w-sm w-full border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <header className="p-5 bg-emerald-600 text-white rounded-t-xl flex justify-between items-center">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        {step === 'payment' && <button onClick={() => setStep('plan')} className="mr-1 hover:bg-white/20 rounded-full p-1"><ArrowLeftIcon className="w-4 h-4" /></button>}
                        <BoltIcon className="w-5 h-5" /> Recharge
                    </h2>
                    <button onClick={closeModal} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-5">
                    <p className={`mb-5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Number: <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{phoneNumber}</span>
                    </p>

                    {step === 'plan' ? (
                        <>
                            <div className="space-y-2.5 mb-6">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPlan === plan.id
                                            ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                                            : isDark
                                                ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className={`font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{plan.name}</span>
                                            <span className="font-bold text-emerald-500">${plan.amount}</span>
                                        </div>
                                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{plan.description}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setStep('payment')}
                                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold text-sm transition-all shadow-lg"
                            >
                                Continue to Payment
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Plan</span>
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedPlanDetails.name}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Amount</span>
                                    <span className="font-bold text-emerald-500">${selectedPlanDetails.amount}</span>
                                </div>
                            </div>

                            <PaymentForm
                                amount={selectedPlanDetails.amount}
                                onSuccess={handlePaymentSuccess}
                                buttonLabel={`Pay $${selectedPlanDetails.amount}`}
                                isDark={isDark}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Subscriptions = () => {
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('billing');
    const [subscriptions, setSubscriptions] = useState([]);
    const [twilioBalance, setTwilioBalance] = useState(0);
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(true);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [rechargeNumber, setRechargeNumber] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const subRes = await axios.get(`${API_BASE_URL}/twilio/subscriptions`);
            if (subRes.data.success) {
                setSubscriptions(subRes.data.subscriptions || []);
                setTwilioBalance(subRes.data.balance);
                setCurrency(subRes.data.currency);
            }
        } catch (err) {
            console.error("Error fetching data", err);
            const errorMsg = err.response
                ? `Server Error (${err.response.status}): ${err.response.data?.message || err.message}`
                : `Network Error: ${err.message}`;
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        socket.on('subscription_updated', fetchData);
        return () => {
            socket.off('subscription_updated');
        };
    }, []);

    const openRechargeModal = (phoneNumber) => {
        setRechargeNumber(phoneNumber);
        setIsRechargeModalOpen(true);
    };

    const totalMonthlyCost = subscriptions.length * 1.15;

    const renderSystemDetails = () => (
        <div className="flex-1 space-y-5 pb-8">
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className={`flex items-center text-lg font-semibold mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    <ClockIcon className={`w-6 h-6 mr-2 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} /> System Status
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FeatureCard
                        icon={CheckCircleIcon}
                        title="System Active"
                        description="Fully operational and connected to Twilio."
                        colorClass="text-emerald-500"
                        isDark={isDark}
                    />
                    <FeatureCard
                        icon={Cog6ToothIcon}
                        title="Configuration"
                        description="Manage API keys in Settings."
                        colorClass="text-blue-500"
                        isDark={isDark}
                    />
                    <FeatureCard
                        icon={ArrowsRightLeftIcon}
                        title="Real-Time Sync"
                        description="Changes synced in real-time."
                        colorClass="text-orange-500"
                        isDark={isDark}
                    />
                </div>
            </div>
        </div>
    );

    const renderPlansAndBilling = () => (
        <div className="flex-1 space-y-5 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 stagger-animation">
                <StatCard
                    title="Active Numbers"
                    value={subscriptions.length}
                    icon={ChartBarIcon}
                    iconColor="text-purple-500"
                    isDark={isDark}
                />
                <StatCard
                    title="Twilio Balance"
                    value={`${currency} ${Number(twilioBalance || 0).toFixed(2)}`}
                    icon={SparklesIcon}
                    iconColor="text-emerald-500"
                    isDark={isDark}
                />
                <StatCard
                    title="Monthly Cost"
                    value={`$${Number(totalMonthlyCost || 0).toFixed(2)}`}
                    icon={CalendarDaysIcon}
                    iconColor="text-orange-500"
                    isDark={isDark}
                />
            </div >

            {error && (
                <div className={`border-l-4 border-red-500 p-4 rounded-r-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                </div>
            )}

            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex flex-col md:flex-row justify-between items-start md:items-center gap-3`}>
                    <div>
                        <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Your Plans & Numbers</h2>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage active phone numbers</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchData}
                            className={`px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 border transition-all ${isDark ? 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'}`}
                        >
                            <ArrowsRightLeftIcon className="w-4 h-4" /> Refresh
                        </button>
                        <button
                            onClick={() => setIsBuyModalOpen(true)}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-semibold text-sm shadow-lg transition-all"
                        >
                            <PlusIcon className="w-4 h-4" /> Buy Number
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="text-center py-16">
                        <PhoneIcon className={`w-14 h-14 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <h3 className={`text-base font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>No active numbers</h3>
                        <p className={`text-sm mb-5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Purchase a number to get started.</p>
                        <button
                            onClick={() => setIsBuyModalOpen(true)}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm shadow-lg transition-all"
                        >
                            Buy your first number
                        </button>
                    </div>
                ) : (
                    <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {subscriptions.map((sub) => (
                            <div key={sub.sid} className={`p-5 flex flex-col md:flex-row md:items-center justify-between transition-colors ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                    <div className={`p-3.5 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                        <PhoneIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-base ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{sub.friendlyName}</h4>
                                        <p className={`font-mono text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{sub.phoneNumber}</p>
                                        <div className="flex gap-1.5 mt-2">
                                            {sub.capabilities?.voice && <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>VOICE</span>}
                                            {sub.capabilities?.sms && <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>SMS</span>}
                                            {sub.capabilities?.mms && <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>MMS</span>}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openRechargeModal(sub.phoneNumber)}
                                    className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 text-sm border transition-all ${isDark ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
                                >
                                    <BoltIcon className="w-4 h-4" /> Recharge
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );

    const renderGuide = () => (
        <div className="flex-1 space-y-6 pb-8">
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    <span className="text-indigo-500">#</span> How to use the Dashboard
                </h2>
                <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Welcome to your control center. Here is a quick guide to help you manage your numbers and subscriptions effectively.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-5 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg bg-indigo-500/10 text-indigo-500`}>
                                <DocumentChartBarIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-semibold text-base mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Managing Numbers</h3>
                                <ul className={`text-sm space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                        <span><strong>Buy Number:</strong> Go to 'Active Subscriptions' and click 'Buy Number'. Search by area code to find your perfect match.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                        <span><strong>Recharge:</strong> Individual numbers can be topped up by clicking the 'Recharge' button next to them.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className={`p-5 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg bg-emerald-500/10 text-emerald-500`}>
                                <CreditCardIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-semibold text-base mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Billing</h3>
                                <ul className={`text-sm space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                        <span><strong>Direct Payment:</strong> Payments for numbers and recharges are processed securely via Stripe.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Elements stripe={stripePromise}>
            <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} font-sans transition-colors duration-300`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Subscriptions & Billing</h1>
                        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage your phone numbers and billing details.</p>
                    </div>

                    <TabNav activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} />

                    <div className="animate-fade-in">
                        {activeTab === 'billing' && renderPlansAndBilling()}
                        {activeTab === 'details' && renderSystemDetails()}
                        {activeTab === 'guide' && renderGuide()}
                    </div>

                    <BuyNumberModal
                        isOpen={isBuyModalOpen}
                        closeModal={() => setIsBuyModalOpen(false)}
                        onBuySuccess={fetchData}
                        isDark={isDark}
                    />

                    <RechargeModal
                        isOpen={isRechargeModalOpen}
                        closeModal={() => setIsRechargeModalOpen(false)}
                        phoneNumber={rechargeNumber}
                        onRechargeSuccess={fetchData}
                        isDark={isDark}
                    />
                </div>
            </div>
        </Elements>
    );
};

export default Subscriptions;