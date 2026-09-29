// screens/PaymentScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    StatusBar,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://orthodoxawiguzo.com/Admin',
};

// Helper: build a proper image URL
const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const cleanPath = imagePath.replace(/^\/+/, '');
    const filename = cleanPath.split('/').pop();
    return `${API_CONFIG.BASE_URL}/uploads/trips/${filename}`;
};

// Helper: pick a value from an object using multiple possible keys
const pick = (obj, ...keys) => {
    if (!obj) return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
            return obj[k];
        }
    }
    return undefined;
};

export default function PaymentScreen({ route, navigation }) {
    const params = route.params || {};
    // Support both parameter names
    const tourData = params.tour || params.trip || {};

    // ----- Normalize the trip object once so both snake_case and camelCase work -----
    const trip = {
        id: pick(tourData, 'id'),
        name: pick(tourData, 'destination', 'name') || 'Tour',
        fromCity: pick(tourData, 'from_city', 'fromCity') || '',
        departureDate: pick(tourData, 'departure_date', 'departureDate') || '',
        duration: pick(tourData, 'duration') || '',
        tourType: pick(tourData, 'tour_type', 'tourType') || 'local',
        tourCategory: pick(tourData, 'tour_category', 'tourCategory') || '',
        description: pick(tourData, 'description') || '',
        price: parseFloat(pick(tourData, 'price') ?? 0) || 0,
        image: pick(tourData, 'image') || null,
        imageUrl: pick(tourData, 'image_url', 'imageUrl') || null,
        createdByCompany: pick(tourData, 'created_by_company', 'createdByCompany') || '',
        bankAccount: pick(tourData, 'bank_account', 'bankAccount') || null,
        status: pick(tourData, 'status') || 'active',
    };

    console.log('📱 Payment Screen received trip:', trip);

    const insets = useSafeAreaInsets();

    const [payerName, setPayerName] = useState('');
    const [phone, setPhone] = useState('');
    const [numberOfPeople, setNumberOfPeople] = useState('1');
    const [specialRequests, setSpecialRequests] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [receiptImage, setReceiptImage] = useState(null);
    const [receiptImageUri, setReceiptImageUri] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [bankAccount, setBankAccount] = useState(trip.bankAccount);

    // ----- Price math -----
    const pricePerPerson = trip.price;
    const peopleCount = parseInt(numberOfPeople, 10) || 1;
    const totalPrice = pricePerPerson * peopleCount;

    // ----- Fallback: fetch bank info if not provided with the trip -----
    useEffect(() => {
        if (bankAccount || !trip.id) return;

        const fetchBankInfo = async () => {
            try {
                const response = await fetch(
                    `${API_CONFIG.BASE_URL}/api_trips_search.php`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'User-Agent':
                                'Mozilla/5.0 (Linux; Android 13) Chrome/120.0.0.0 Mobile Safari/537.36',
                        },
                    }
                );
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    const found = data.data.find((item) => item.id === trip.id);
                    if (found?.bank_account) {
                        setBankAccount(found.bank_account);
                    }
                }
            } catch (error) {
                console.error('Error fetching bank info:', error);
            }
        };

        fetchBankInfo();
    }, [trip.id, bankAccount]);

    const imageUrl = getImageUrl(trip.image) || trip.imageUrl;
    const hasImage = imageUrl && !imageError;

    // ----- Image picker permissions -----
    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Sorry, we need camera roll permissions to upload receipt.'
                );
                return false;
            }
        }
        return true;
    };

    const pickReceiptImage = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setReceiptImageUri(asset.uri);
                setReceiptImage({
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: asset.fileName || `receipt_${Date.now()}.jpg`,
                });
                console.log('📸 Receipt image selected:', asset.uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const takeReceiptPhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setReceiptImageUri(asset.uri);
                setReceiptImage({
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: asset.fileName || `receipt_${Date.now()}.jpg`,
                });
                console.log('📸 Receipt photo taken:', asset.uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
    };

    const handleAddReceipt = () => {
        Alert.alert(
            'Upload Payment Receipt',
            'Choose an option to upload your payment receipt',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Choose from Gallery', onPress: pickReceiptImage },
                { text: 'Take Photo', onPress: takeReceiptPhoto },
            ]
        );
    };

    const removeReceipt = () => {
        setReceiptImage(null);
        setReceiptImageUri(null);
    };

    // ----- Build the multipart body -----
    const buildFormData = (orderData) => {
        const formData = new FormData();
        const receiptFile = orderData.receiptImage || receiptImage;

        const now = new Date();
        const nowDateTime = now.toISOString().replace('T', ' ').substring(0, 19);

        formData.append('tour_id', String(orderData.tourId || trip.id || 0));
        formData.append('tour_name', String(orderData.tourName || trip.name));
        formData.append('payer_name', String(orderData.payerName || payerName || ''));
        formData.append('phone', String(orderData.phone || phone || ''));
        formData.append(
            'number_of_people',
            String(orderData.numberOfPeople || peopleCount || 1)
        );
        formData.append(
            'price_per_person',
            String(orderData.pricePerPerson ?? pricePerPerson ?? 0)
        );
        formData.append('total_price', String(orderData.totalPrice ?? totalPrice ?? 0));
        formData.append(
            'special_requests',
            String(orderData.specialRequests || specialRequests || '')
        );
        formData.append('from_city', String(orderData.fromCity || trip.fromCity || ''));
        formData.append(
            'departure_date',
            String(orderData.departureDate || trip.departureDate || '')
        );
        formData.append('duration', String(orderData.duration || trip.duration || ''));
        formData.append('tour_type', String(orderData.tourType || trip.tourType || ''));
        formData.append(
            'tour_category',
            String(orderData.tourCategory || trip.tourCategory || '')
        );
        formData.append('status', 'pending');
        formData.append(
            'booking_date',
            String(orderData.bookingDate || nowDateTime)
        );
        formData.append('seat_volume', String(orderData.numberOfPeople || peopleCount || 1));
        formData.append('created_at', nowDateTime);
        formData.append('updated_at', nowDateTime);

        if (receiptFile) {
            formData.append('receipt_image', {
                uri: receiptFile.uri,
                type: receiptFile.type || 'image/jpeg',
                name: receiptFile.name || `receipt_${Date.now()}.jpg`,
            });
        }

        return formData;
    };

    // ----- Save order to server -----
    const saveOrderToDatabase = async (orderData) => {
        const formData = buildFormData(orderData);

        const url = `${API_CONFIG.BASE_URL}/api_create_order.php`;
        console.log('📤 Sending order to:', url);
        console.log(
            '📤 FormData keys:',
            formData._parts.map(([key]) => key)
        );

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            // NOTE: Do NOT set Content-Type — fetch must set the boundary
            headers: {
                // WAF-friendly headers:
                Accept: 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                Origin: 'https://orthodoxawiguzo.com',
                Referer: 'https://orthodoxawiguzo.com/',
            },
        });

        const textResponse = await response.text();
        console.log('📥 Server response (HTTP', response.status, '):', textResponse);

        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (e) {
            throw new Error(
                `Server returned ${response.status} (not JSON). First 200 chars: ${textResponse.substring(0, 200)}`
            );
        }

        if (result.success) return result;
        throw new Error(result.message || 'Failed to save order');
    };

    const goToHome = () => {
        setShowSuccessModal(false);
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
        });
    };

    const handleSendOrder = async () => {
        // ----- Validation -----
        if (!payerName.trim()) {
            Alert.alert('Validation Error', 'Please enter your name.');
            return;
        }
        if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
            Alert.alert('Validation Error', 'Please enter a valid phone number (10+ digits).');
            return;
        }
        if (peopleCount < 1) {
            Alert.alert('Validation Error', 'Number of people must be at least 1.');
            return;
        }
        if (!receiptImage) {
            Alert.alert('Validation Error', 'Please upload a payment receipt.');
            return;
        }
        if (!trip.id) {
            Alert.alert(
                'Validation Error',
                'Trip information is missing. Please go back and try again.'
            );
            return;
        }

        setIsLoading(true);

        try {
            const bookingDate = new Date()
                .toISOString()
                .replace('T', ' ')
                .substring(0, 19);

            const orderData = {
                tourId: trip.id,
                tourName: trip.name,
                fromCity: trip.fromCity,
                departureDate: trip.departureDate,
                duration: trip.duration,
                tourType: trip.tourType,
                tourCategory: trip.tourCategory,
                payerName: payerName.trim(),
                phone: phone.trim(),
                numberOfPeople: peopleCount,
                pricePerPerson,
                totalPrice,
                specialRequests: specialRequests.trim(),
                bookingDate,
                receiptImage,
            };

            console.log('📝 Order Data:', orderData);

            const result = await saveOrderToDatabase(orderData);

            setSuccessData({
                payerName: payerName.trim(),
                tourName: orderData.tourName,
                peopleCount,
                totalPrice: totalPrice.toFixed(2),
                orderId: result.order_id || 'N/A',
                seatsRemaining: result.seats_remaining ?? 'N/A',
            });
            setShowSuccessModal(true);
        } catch (error) {
            console.error('❌ Order error:', error);
            Alert.alert(
                'Order Error',
                `Failed to send order: ${error.message}\n\nPlease try again or contact support.`
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Padding for floating tab bar (only if this screen is inside tabs;
    // here it's a stack screen, so just use safe-area)
    const bottomPad = Math.max(insets.bottom, 16);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#0E3D59" />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: bottomPad + 20 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Place Order</Text>
                        <View style={styles.headerRight} />
                    </View>

                    {/* Tour Summary Card */}
                    <View style={styles.tourCard}>
                        <View style={styles.tourImageContainer}>
                            {hasImage ? (
                                <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.tourImage}
                                    onError={() => {
                                        console.log('❌ Image failed to load:', imageUrl);
                                        setImageError(true);
                                    }}
                                />
                            ) : (
                                <View style={styles.tourImagePlaceholder}>
                                    <Icon name="image-outline" size={40} color="#9DC8E1" />
                                </View>
                            )}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.6)']}
                                style={styles.tourImageOverlay}
                            />
                            <View style={styles.tourBadge}>
                                <Text style={styles.tourBadgeText}>
                                    {(trip.tourType || 'LOCAL').toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tourInfo}>
                            <Text style={styles.tourName}>{trip.name}</Text>
                            <View style={styles.tourDetails}>
                                <View style={styles.tourDetailItem}>
                                    <Icon name="location-outline" size={16} color="#357B97" />
                                    <Text style={styles.tourDetailText}>
                                        {trip.fromCity || 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.tourDetailItem}>
                                    <Icon name="calendar-outline" size={16} color="#357B97" />
                                    <Text style={styles.tourDetailText}>
                                        {trip.duration || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceLabel}>Price per person</Text>
                                <Text style={styles.priceValue}>
                                    {pricePerPerson} Birr
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Order Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>📋 Order Details</Text>

                        {/* Number of People */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Number of People</Text>
                            <View style={styles.peopleSelector}>
                                <TouchableOpacity
                                    style={styles.peopleButton}
                                    onPress={() => {
                                        const current = parseInt(numberOfPeople, 10) || 1;
                                        if (current > 1) {
                                            setNumberOfPeople((current - 1).toString());
                                        }
                                    }}
                                >
                                    <Icon name="remove-outline" size={24} color="#0E3D59" />
                                </TouchableOpacity>
                                <Text style={styles.peopleCount}>{numberOfPeople}</Text>
                                <TouchableOpacity
                                    style={styles.peopleButton}
                                    onPress={() => {
                                        const current = parseInt(numberOfPeople, 10) || 1;
                                        if (current < 20) {
                                            setNumberOfPeople((current + 1).toString());
                                        } else {
                                            Alert.alert(
                                                'Maximum',
                                                'Maximum 20 people per booking.'
                                            );
                                        }
                                    }}
                                >
                                    <Icon name="add-outline" size={24} color="#0E3D59" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Total Price */}
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalPrice}>
                                {totalPrice} Birr
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Bank Account Details */}
                        {bankAccount && (
                            <View style={styles.bankInfoContainer}>
                                <Text style={styles.bankInfoValue}>
                                    <Text style={styles.bankInfoLabel}>Company: </Text>
                                    {bankAccount.company || trip.createdByCompany || 'N/A'}
                                </Text>
                                <Text style={styles.bankInfoValue}>
                                    <Text style={styles.bankInfoLabel}>Account Holder: </Text>
                                    {bankAccount.account_holder_name || 'N/A'}
                                </Text>
                                <Text style={styles.bankInfoValue}>
                                    <Text style={styles.bankInfoLabel}>Account Number: </Text>
                                    {bankAccount.account_number || 'N/A'}
                                </Text>
                            </View>
                        )}

                        {/* Payer Name */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Full Name <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                value={payerName}
                                onChangeText={setPayerName}
                                placeholderTextColor="#69ABCC"
                            />
                        </View>

                        {/* Phone */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Phone Number <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+251 9XX XXX XXX"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholderTextColor="#69ABCC"
                            />
                        </View>

                        {/* Receipt Upload */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Payment Receipt <Text style={styles.required}>*</Text>
                            </Text>
                            <Text style={styles.helperText}>
                                Upload a photo of your payment receipt (bank transfer, mobile
                                money, etc.)
                            </Text>

                            {receiptImageUri ? (
                                <View style={styles.receiptContainer}>
                                    <TouchableOpacity
                                        onPress={() => setShowImageModal(true)}
                                        activeOpacity={0.9}
                                    >
                                        <Image
                                            source={{ uri: receiptImageUri }}
                                            style={styles.receiptPreview}
                                            resizeMode="contain"
                                        />
                                        <View style={styles.tapToExpandContainer}>
                                            <Icon
                                                name="expand-outline"
                                                size={16}
                                                color="#357B97"
                                            />
                                            <Text style={styles.tapToExpandText}>
                                                Tap to expand
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={styles.receiptActions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.receiptButton,
                                                styles.receiptButtonChange,
                                            ]}
                                            onPress={handleAddReceipt}
                                        >
                                            <Icon
                                                name="refresh-outline"
                                                size={20}
                                                color="#0E3D59"
                                            />
                                            <Text style={styles.receiptButtonText}>
                                                Change
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.receiptButton,
                                                styles.receiptButtonRemove,
                                            ]}
                                            onPress={removeReceipt}
                                        >
                                            <Icon
                                                name="trash-outline"
                                                size={20}
                                                color="#ef4444"
                                            />
                                            <Text
                                                style={[
                                                    styles.receiptButtonText,
                                                    { color: '#ef4444' },
                                                ]}
                                            >
                                                Remove
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={handleAddReceipt}
                                    activeOpacity={0.8}
                                >
                                    <Icon
                                        name="cloud-upload-outline"
                                        size={32}
                                        color="#0E3D59"
                                    />
                                    <Text style={styles.uploadButtonText}>
                                        Tap to Upload Receipt
                                    </Text>
                                    <Text style={styles.uploadButtonSubtext}>
                                        JPG, PNG accepted (max 5MB)
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Special Requests */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Special Requests</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Any special requirements or requests..."
                                value={specialRequests}
                                onChangeText={setSpecialRequests}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                placeholderTextColor="#69ABCC"
                            />
                        </View>
                    </View>

                    {/* Send Order Button */}
                    <View style={styles.paymentButtonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.paymentButton,
                                isLoading && styles.paymentButtonDisabled,
                            ]}
                            onPress={handleSendOrder}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="send-outline" size={22} color="#fff" />
                                    <Text style={styles.paymentButtonText}>
                                        Send Order
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Full Screen Image Modal */}
            <Modal
                visible={showImageModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPress={() => setShowImageModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Image
                            source={{ uri: receiptImageUri }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                        <View style={styles.modalCloseButtonContainer}>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowImageModal(false)}
                            >
                                <Icon name="close-circle" size={44} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.modalCloseText}>
                                Tap anywhere to close
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    goToHome();
                }}
            >
                <View style={styles.successBackdrop}>
                    <View style={styles.successCard}>
                        <View style={styles.successIconWrap}>
                            <Icon name="checkmark-circle" size={52} color="#ffffff" />
                        </View>

                        <Text style={styles.successTitle}>Order Submitted</Text>
                        <Text style={styles.successMessage}>
                            Thank you, {successData?.payerName || 'traveler'}!
                        </Text>

                        <View style={styles.successInfoBox}>
                            <Text style={styles.successRow}>
                                <Text style={styles.successLabel}>Order ID: </Text>
                                {successData?.orderId || 'N/A'}
                            </Text>
                            <Text style={styles.successRow}>
                                <Text style={styles.successLabel}>Tour: </Text>
                                {successData?.tourName || 'Trip'}
                            </Text>
                            <Text style={styles.successRow}>
                                <Text style={styles.successLabel}>People: </Text>
                                {successData?.peopleCount || 1}
                            </Text>
                            <Text style={styles.successRow}>
                                <Text style={styles.successLabel}>Total: </Text>
                                {successData?.totalPrice || '0.00'} Birr
                            </Text>
                        </View>

                        <Text style={styles.successFooter}>
                            We will confirm your order after verifying the payment receipt.
                        </Text>

                        <TouchableOpacity
                            style={styles.successButton}
                            onPress={goToHome}
                        >
                            <Text style={styles.successButtonText}>Go Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0E3D59' },
    container: { flex: 1, backgroundColor: '#F3F9FC' },
    scrollContent: { flexGrow: 1, paddingBottom: 20 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0E3D59',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
    headerRight: { width: 32 },

    tourCard: {
        backgroundColor: '#ffffff',
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    tourImageContainer: { width: '100%', height: 160, position: 'relative' },
    tourImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    tourImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#EAF5FB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tourImageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    tourBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#0E3D59',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tourBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tourInfo: { padding: 16 },
    tourName: { fontSize: 20, fontWeight: '700', color: '#0E3D59', marginBottom: 8 },
    tourDetails: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    tourDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tourDetailText: { fontSize: 14, color: '#357B97' },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EAF5FB',
    },
    priceLabel: { fontSize: 14, color: '#357B97' },
    priceValue: { fontSize: 24, fontWeight: '800', color: '#0E3D59' },

    formContainer: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    formTitle: { fontSize: 18, fontWeight: '700', color: '#0E3D59', marginBottom: 16 },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#0E3D59', marginBottom: 6 },
    required: { color: '#ef4444' },
    helperText: { fontSize: 12, color: '#357B97', marginBottom: 8 },
    input: {
        backgroundColor: '#f9f7f3',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#0E3D59',
    },
    textArea: { height: 80, paddingTop: 12 },

    peopleSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#f9f7f3',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    peopleButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    peopleCount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0E3D59',
        minWidth: 40,
        textAlign: 'center',
    },

    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#0E3D59',
    },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#0E3D59' },
    totalPrice: { fontSize: 24, fontWeight: '800', color: '#0E3D59' },

    divider: { height: 1, backgroundColor: '#EAF5FB', marginVertical: 16 },

    bankInfoContainer: {
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#cfe8ff',
    },
    bankInfoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0E3D59',
        marginBottom: 4,
    },
    bankInfoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0E3D59',
        marginBottom: 8,
    },

    uploadButton: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#f9f7f3',
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0E3D59',
        marginTop: 8,
    },
    uploadButtonSubtext: { fontSize: 12, color: '#69ABCC', marginTop: 4 },

    receiptContainer: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#f9f7f3',
    },
    receiptPreview: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    tapToExpandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        backgroundColor: '#EAF5FB',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        marginTop: 2,
        gap: 4,
    },
    tapToExpandText: { fontSize: 12, color: '#357B97' },
    receiptActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 12,
    },
    receiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#ffffff',
    },
    receiptButtonChange: { borderColor: '#0E3D59' },
    receiptButtonRemove: { borderColor: '#ef4444' },
    receiptButtonText: { fontSize: 14, fontWeight: '500', color: '#0E3D59' },

    paymentButtonContainer: { marginHorizontal: 16, gap: 12 },
    paymentButton: {
        backgroundColor: '#0E3D59',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 10,
        shadowColor: '#0E3D59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    paymentButtonDisabled: { opacity: 0.6 },
    paymentButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
    cancelButton: { alignItems: 'center', paddingVertical: 12 },
    cancelButtonText: { fontSize: 16, color: '#357B97', fontWeight: '600' },

    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '95%',
        height: '85%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: { width: '100%', height: '100%', borderRadius: 12 },
    modalCloseButtonContainer: {
        position: 'absolute',
        bottom: -40,
        alignItems: 'center',
        width: '100%',
    },
    modalCloseButton: { padding: 8 },
    modalCloseText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },

    successBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(7, 24, 39, 0.58)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 22,
    },
    successCard: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    successIconWrap: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0E3D59',
        marginBottom: 6,
    },
    successMessage: {
        fontSize: 15,
        color: '#357B97',
        marginBottom: 18,
        textAlign: 'center',
    },
    successInfoBox: {
        width: '100%',
        backgroundColor: '#f4fbff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#d5edf8',
        marginBottom: 18,
    },
    successRow: {
        fontSize: 15,
        color: '#0E3D59',
        marginBottom: 8,
    },
    successLabel: {
        fontWeight: '700',
    },
    successFooter: {
        fontSize: 13,
        color: '#357B97',
        textAlign: 'center',
        marginBottom: 18,
        lineHeight: 20,
    },
    successButton: {
        width: '100%',
        backgroundColor: '#0E3D59',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    successButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});