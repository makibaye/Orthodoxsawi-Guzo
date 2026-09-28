// src/screens/ToursListScreen.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Alert,
    Dimensions,
    Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

// API Configurationnice
const API_CONFIG = {
    BASE_URL: 'https://orthodoxawiguzo.com/Admin',
    IMAGE_BASE_URL: 'https://orthodoxawiguzo.com/Admin',
    ENDPOINTS: {
        SEARCH_TRIPS: '/api_trips_search.php',
        GET_ALL_TRIPS: '/api_trips.php',
    },
};

const { width } = Dimensions.get('window');
const CARD_IMAGE_HEIGHT = 180;

// Extra space so content isn't hidden behind the floating tab bar
const TAB_BAR_HEIGHT = 70;
const TAB_BAR_MARGIN_BOTTOM = 32;

export default function ToursListScreen({ navigation, route }) {
    const {
        fromCity,
        destination,
        departureDate,
        tourType,
        tourCategory,
        churchId,
        currentLocation,
        currentCity,
        date,
    } = route.params || {};

    const insets = useSafeAreaInsets();

    const [tours, setTours] = useState([]);
    const [filteredTours, setFilteredTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [activeTab, setActiveTab] = useState('local');
    const [imageErrors, setImageErrors] = useState({});

    // Track whether the initial fetch already happened for this focus session
    const hasInitialFetched = useRef(false);

    const getApiUrl = (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`;

    // ---------- Image URL helper ----------
    const getImageUrl = (item) => {
        if (!item) return null;

        if (item.image_url && /^https?:\/\//.test(item.image_url)) {
            return item.image_url;
        }

        const imagePath = item.image;
        if (!imagePath) return null;

        if (/^https?:\/\//.test(imagePath)) return imagePath;

        let cleanPath = imagePath.replace(/^\/+/, '');

        if (cleanPath.includes('uploads/')) {
            return `${API_CONFIG.IMAGE_BASE_URL}/${cleanPath}`;
        }
        return `${API_CONFIG.IMAGE_BASE_URL}/uploads/trips/${cleanPath}`;
    };

    // ---------- Fetch trips ----------
    const fetchTours = async (filters = {}) => {
        try {
            setError(null);
            setLoading(true);

            const params = new URLSearchParams();
            if (filters.fromCity || fromCity) params.append('from_city', filters.fromCity || fromCity);
            if (filters.destination || destination) params.append('destination', filters.destination || destination);
            if (filters.departureDate || departureDate) params.append('departure_date', filters.departureDate || departureDate);
            if (filters.tourType || tourType) params.append('tour_type', filters.tourType || tourType);
            if (filters.tourCategory || tourCategory) params.append('tour_category', filters.tourCategory || tourCategory);
            params.append('status', 'active');
            params.append('include_bank_account', '1');

            const queryString = params.toString();
            const url = `${getApiUrl(API_CONFIG.ENDPOINTS.SEARCH_TRIPS)}${queryString ? '?' + queryString : ''}`;

            console.log('📡 Fetching from URL:', url);
            setDebugInfo(`Searching: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });

            const rawText = await response.text();
            console.log('🔗 Raw response (first 200 chars):', rawText.substring(0, 200));

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseErr) {
                console.error('❌ JSON Parse Error:', parseErr);
                throw new Error(`Invalid JSON response: ${rawText.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} - ${data.message || 'Unknown error'}`);
            }

            let tripsArray = [];
            if (data.success && Array.isArray(data.data)) tripsArray = data.data;
            else if (Array.isArray(data)) tripsArray = data;
            else if (data && typeof data === 'object' && data.data)
                tripsArray = Array.isArray(data.data) ? data.data : [data.data];
            else tripsArray = [];

            console.log('📊 Trips found:', tripsArray.length);

            // ---------- MAP API -> UI shape ----------
            const mapped = tripsArray.map(item => {
                const includesArr =
                    Array.isArray(item.includes_array) ? item.includes_array :
                        (typeof item.includes === 'string' && item.includes.trim()
                            ? item.includes.split(',').map(i => i.trim()).filter(Boolean)
                            : []);

                const excludesArr =
                    Array.isArray(item.excludes_array) ? item.excludes_array :
                        (typeof item.excludes === 'string' && item.excludes.trim()
                            ? item.excludes.split(',').map(i => i.trim()).filter(Boolean)
                            : []);

                const bank = item.bank_account || null;
                const bank_account = bank
                    ? {
                        id: bank.id ?? null,
                        account_number: bank.account_number ?? '',
                        account_holder_name: bank.account_holder_name ?? '',
                    }
                    : null;

                return {
                    id: item.id,
                    name: item.destination || 'Unknown Destination',
                    fromCity: item.from_city || 'አዲስ አበባ',
                    departureDate: item.departure_date || new Date().toISOString().split('T')[0],
                    tourType: item.tour_type || 'ሀገር ዉስጥ',
                    tourCategory: item.tour_category || 'ደርሶ መልስ',
                    duration: item.duration || '3 Days',
                    description: item.description,
                    price: item.price ?? 0,
                    status: item.status || 'active',

                    includes: includesArr,
                    excludes: excludesArr,

                    createdAt: item.created_at,
                    updatedAt: item.updated_at,

                    image: item.image || null,
                    image_url: getImageUrl(item),

                    createdByUsername: item.created_by_username || null,
                    createdByCompany: item.created_by_company || null,
                    createdByFullName: item.created_by_full_name || null,

                    created_by_username: item.created_by_username || null,
                    created_by_company: item.created_by_company || null,
                    created_by_full_name: item.created_by_full_name || null,

                    bank_account,

                    itinerary: item.itinerary || null,
                    maxPeople: item.max_people || null,
                    availableSeats: item.available_seats || null,
                };
            });

            setTours(mapped);
            filterToursByTab(mapped, activeTab);
            setDebugInfo(`✅ Loaded ${mapped.length} trips successfully`);

            if (mapped.length === 0) {
                Alert.alert('No Results', 'No trips found matching your search criteria.');
            }
        } catch (err) {
            console.error('❌ Fetch error:', err);

            let errorMessage = err.message;
            if (err.message.includes('Network request failed')) {
                errorMessage =
                    'Network Error!\n\n' +
                    'Please check:\n' +
                    '1. 📱 Phone and computer on same WiFi\n' +
                    '2. 💻 XAMPP/WAMP is running\n' +
                    `3. 🔢 IP: ${API_CONFIG.BASE_URL}\n` +
                    '4. 🔥 Windows Firewall allows Apache\n' +
                    '5. 🌐 Try: http://localhost/Back End/api_trips_search.php in browser';
            } else if (err.message.includes('Invalid JSON')) {
                errorMessage = `API Response Error\n\n${err.message}`;
            }

            setError(errorMessage);
            setDebugInfo(`❌ ${err.message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterToursByTab = (toursData, tab) => {
        if (!toursData || toursData.length === 0) {
            setFilteredTours([]);
            return;
        }
        let filtered;
        if (tab === 'local') {
            filtered = toursData.filter(t =>
                t.tourType?.toLowerCase() === 'local' ||
                t.tourType?.toLowerCase() === 'domestic'
            );
        } else {
            filtered = toursData.filter(t =>
                t.tourType?.toLowerCase() === 'international' ||
                t.tourType?.toLowerCase() === 'foreign'
            );
        }
        setFilteredTours(filtered);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        filterToursByTab(tours, tab);
    };

    // ---------- Load on focus, reset on blur ----------
    useFocusEffect(
        useCallback(() => {
            // Fetch only on the first focus of this visit
            if (!hasInitialFetched.current) {
                hasInitialFetched.current = true;

                const hasSearchParams =
                    fromCity || destination || departureDate || tourType || tourCategory;

                if (hasSearchParams) {
                    console.log('🔍 Initial search with filters:', {
                        fromCity, destination, departureDate, tourType, tourCategory,
                    });
                    fetchTours({ fromCity, destination, departureDate, tourType, tourCategory });
                } else {
                    fetchTours({});
                }
            }

            return () => {
                // ---------- CLEAR EVERYTHING WHEN LEAVING ----------
                console.log('🧹 ToursListScreen blurred — clearing search history');

                setTours([]);
                setFilteredTours([]);
                setError(null);
                setDebugInfo('');
                setImageErrors({});
                setActiveTab('local');
                hasInitialFetched.current = false;

                // Clear leftover search params so next visit = fresh unfiltered list
                navigation.setParams({
                    fromCity: undefined,
                    destination: undefined,
                    departureDate: undefined,
                    tourType: undefined,
                    tourCategory: undefined,
                    churchId: undefined,
                    currentLocation: undefined,
                    currentCity: undefined,
                    date: undefined,
                });
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [fromCity, destination, departureDate, tourType, tourCategory, navigation])
    );

    // Re-filter whenever the source list or tab changes
    useEffect(() => {
        filterToursByTab(tours, activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tours, activeTab]);

    const handleRefresh = () => {
        setRefreshing(true);
        const filters = {};
        if (fromCity) filters.fromCity = fromCity;
        if (destination) filters.destination = destination;
        if (departureDate) filters.departureDate = departureDate;
        if (tourType) filters.tourType = tourType;
        if (tourCategory) filters.tourCategory = tourCategory;
        fetchTours(filters);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return '#10b981';
            case 'completed': return '#3b82f6';
            case 'cancelled': return '#ef4444';
            default: return '#357B97';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'checkmark-circle-outline';
            case 'completed': return 'checkmark-done-circle-outline';
            case 'cancelled': return 'close-circle-outline';
            default: return 'ellipse-outline';
        }
    };

    const getTourTypeIcon = (type) => {
        return type === 'local' || type === 'domestic' ? 'location-outline' : 'earth-outline';
    };

    const formatDate = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateString || 'N/A';
        }
    };

    const handleImageError = (tripId) => {
        setImageErrors(prev => ({ ...prev, [tripId]: true }));
        console.log(`❌ Image failed to load for trip ${tripId}`);
    };

    const renderItem = ({ item }) => {
        const hasImage = item.image_url && !imageErrors[item.id];
        const imageSource = hasImage ? { uri: item.image_url } : null;

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('TripDetails', { trip: item })}
            >
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Icon name={getStatusIcon(item.status)} size={10} color="#fff" />
                    <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
                </View>

                <View style={styles.imageContainer}>
                    {imageSource ? (
                        <Image
                            source={imageSource}
                            style={styles.tripImage}
                            resizeMode="cover"
                            onError={() => {
                                console.log(`❌ Image load error for trip ${item.id}: ${item.image_url}`);
                                handleImageError(item.id);
                            }}
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Icon name="image-outline" size={50} color="#9DC8E1" />
                            <Text style={styles.imagePlaceholderText}>No Image</Text>
                        </View>
                    )}

                    <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>{parseFloat(item.price)} Birr</Text>
                    </View>

                    <View style={styles.tourTypeBadge}>
                        <Icon name={getTourTypeIcon(item.tourType)} size={12} color="#fff" />
                        <Text style={styles.tourTypeBadgeText}>
                            {item.tourType?.charAt(0).toUpperCase() + item.tourType?.slice(1) || 'N/A'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.destinationContainer}>
                            <View style={styles.titleRow}>
                                <Text style={styles.destinationName} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                {item.createdByCompany && (
                                    <View style={styles.companyBadge}>
                                        <Icon name="business-outline" size={12} color="#0E3D59" />
                                        <Text style={styles.companyBadgeText} numberOfLines={1}>
                                            {item.createdByCompany}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.locationContainer}>
                                <Icon name="location-outline" size={14} color="#a76904" />
                                <Text style={styles.locationText}>From: {item.fromCity}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Icon name="calendar-outline" size={14} color="#357B97" />
                            <Text style={styles.infoText}>{formatDate(item.departureDate)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Icon name="time-outline" size={14} color="#357B97" />
                            <Text style={styles.infoText}>{item.duration}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Icon name="pricetag-outline" size={14} color="#357B97" />
                            <Text style={styles.categoryText}>{item.tourCategory}</Text>
                        </View>
                    </View>

                    {item.description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    {item.includes && item.includes.length > 0 && (
                        <View style={styles.tagsContainer}>
                            <Icon name="checkmark-circle-outline" size={14} color="#10b981" />
                            {item.includes.slice(0, 3).map((include, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{include}</Text>
                                </View>
                            ))}
                            {item.includes.length > 3 && (
                                <Text style={styles.moreText}>+{item.includes.length - 3} more</Text>
                            )}
                        </View>
                    )}

                    <View style={styles.cardFooter}>
                        <TouchableOpacity
                            style={styles.detailsButton}
                            onPress={() => navigation.navigate('TripDetails', { trip: item })}
                        >
                            <Text style={styles.detailsButtonText}>Details</Text>
                            <Icon name="arrow-forward-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderTabs = () => {
        const localCount = tours.filter(t => t.tourType?.toLowerCase() === 'local' || t.tourType?.toLowerCase() === 'domestic').length;
        const internationalCount = tours.filter(t => t.tourType?.toLowerCase() === 'international' || t.tourType?.toLowerCase() === 'foreign').length;

        return (
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'local' && styles.activeTab]}
                    onPress={() => handleTabChange('local')}
                    activeOpacity={0.8}
                >
                    <Icon name="location-outline" size={18} color={activeTab === 'local' ? '#0E3D59' : '#357B97'} />
                    <Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>ሀገር ዉስጥ</Text>
                    <View style={[styles.tabCount, activeTab === 'local' && styles.activeTabCount]}>
                        <Text style={[styles.tabCountText, activeTab === 'local' && { color: '#fff' }]}>{localCount}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'international' && styles.activeTab]}
                    onPress={() => handleTabChange('international')}
                    activeOpacity={0.8}
                >
                    <Icon name="earth-outline" size={18} color={activeTab === 'international' ? '#0E3D59' : '#357B97'} />
                    <Text style={[styles.tabText, activeTab === 'international' && styles.activeTabText]}>ከሀገር ዉጭ</Text>
                    <View style={[styles.tabCount, activeTab === 'international' && styles.activeTabCount]}>
                        <Text style={[styles.tabCountText, activeTab === 'international' && { color: '#fff' }]}>{internationalCount}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    // Bottom padding so content isn't hidden behind the floating tab bar
    const bottomPadding = TAB_BAR_HEIGHT + TAB_BAR_MARGIN_BOTTOM + insets.bottom + 16;

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor="#F3F9FC" />
                <View style={styles.skeletonContainer}>
                    <View style={styles.skeletonTabs}>
                        <View style={[styles.skeletonPill, styles.skeletonLight]} />
                        <View style={[styles.skeletonPill, styles.skeletonLight]} />
                    </View>

                    {[1, 2, 3].map((item) => (
                        <View key={item} style={styles.skeletonCard}>
                            <View style={[styles.skeletonImage, styles.skeletonShimmer]} />
                            <View style={styles.skeletonBody}>
                                <View style={[styles.skeletonLine, styles.skeletonShort, styles.skeletonShimmer]} />
                                <View style={[styles.skeletonLine, styles.skeletonMedium, styles.skeletonShimmer]} />
                                <View style={[styles.skeletonLine, styles.skeletonLong, styles.skeletonShimmer]} />
                                <View style={styles.skeletonRow}>
                                    <View style={[styles.skeletonChip, styles.skeletonShimmer]} />
                                    <View style={[styles.skeletonChip, styles.skeletonShimmer]} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.centerContainer}>
                    <Icon name="alert-circle-outline" size={60} color="#ef4444" />
                    <Text style={styles.errorTitle}>Connection Error</Text>
                    <Text style={styles.errorText}>{error}</Text>

                    <View style={styles.troubleshootContainer}>
                        <Text style={styles.troubleshootTitle}>🔧 Quick Fixes:</Text>
                        <Text style={styles.troubleshootText}>1. Make sure your computer and phone are on the same WiFi</Text>
                        <Text style={styles.troubleshootText}>2. Check if XAMPP/WAMP is running</Text>
                        <Text style={styles.troubleshootText}>3. Test in phone browser:</Text>
                        <Text style={[styles.troubleshootText, { fontWeight: 'bold' }]}>
                            {API_CONFIG.BASE_URL}/api_trips_search.php
                        </Text>
                        <Text style={styles.troubleshootText}>4. Check Windows Firewall settings</Text>
                        <Text style={styles.troubleshootText}>5. Update API_CONFIG.BASE_URL with your computer's IP</Text>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                            <Icon name="refresh-outline" size={20} color="#fff" />
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.debugText}>🔍 {debugInfo}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (filteredTours.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.container}>
                    {renderTabs()}
                    <View style={styles.centerContainer}>
                        <Icon name="search-outline" size={60} color="#9DC8E1" />
                        <Text style={styles.emptyTitle}>No {activeTab} trips found</Text>
                        <Text style={styles.emptyText}>
                            {destination
                                ? `No ${activeTab} trips found for "${destination}"`
                                : `No ${activeTab} trips available. Check back later.`}
                        </Text>
                        <View style={styles.searchSummary}>
                            <Text style={styles.searchSummaryTitle}>Search Filters:</Text>
                            {fromCity && <Text style={styles.searchSummaryText}>📍 From: {fromCity}</Text>}
                            {destination && <Text style={styles.searchSummaryText}>🎯 Destination: {destination}</Text>}
                            {departureDate && <Text style={styles.searchSummaryText}>📅 Date: {departureDate}</Text>}
                            {tourCategory && <Text style={styles.searchSummaryText}>🏷️ Category: {tourCategory}</Text>}
                        </View>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                            <Icon name="refresh-outline" size={20} color="#fff" />
                            <Text style={styles.retryButtonText}>Refresh</Text>
                        </TouchableOpacity>
                        <Text style={styles.debugText}>🔍 {debugInfo}</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F9FC" />
            <View style={styles.container}>
                {renderTabs()}

                <FlatList
                    data={filteredTours}
                    keyExtractor={item => item.id?.toString() || Math.random().toString()}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.list,
                        { paddingBottom: bottomPadding },
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#0E3D59']}
                            tintColor="#0E3D59"
                        />
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F9FC' },
    container: { flex: 1, backgroundColor: '#F3F9FC' },
    centerContainer: {
        flex: 1,
        backgroundColor: '#F3F9FC',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e8eef3',
        shadowColor: '#0E3D59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderRadius: 10,
        gap: 5,
        backgroundColor: 'transparent',
    },
    activeTab: { backgroundColor: '#EAF5FB', borderWidth: 1, borderColor: '#D7ECF7' },
    tabText: { fontSize: 12, fontWeight: '700', color: '#357B97' },
    activeTabText: { color: '#0E3D59' },
    tabCount: {
        backgroundColor: '#EAF5FB',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    activeTabCount: { backgroundColor: '#0E3D59' },
    tabCountText: { fontSize: 10, fontWeight: '700', color: '#357B97' },
    searchSummary: {
        backgroundColor: '#f8f6f1',
        padding: 16,
        borderRadius: 12,
        marginVertical: 12,
        width: '100%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchSummaryTitle: { fontSize: 14, fontWeight: '700', color: '#0E3D59', marginBottom: 8 },
    searchSummaryText: { fontSize: 13, color: '#357B97', marginBottom: 4 },
    list: { padding: 16, paddingTop: 8 },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: CARD_IMAGE_HEIGHT,
        backgroundColor: '#EAF5FB',
        position: 'relative',
    },
    tripImage: { width: '100%', height: '100%', backgroundColor: '#EAF5FB' },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EAF5FB',
    },
    imagePlaceholderText: { fontSize: 14, color: '#69ABCC', marginTop: 8, fontWeight: '500' },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 2,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    statusText: { color: '#ffffff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    priceBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#0E3D59',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    priceBadgeText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
    tourTypeBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 2,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    tourTypeBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
    cardContent: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    destinationContainer: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    destinationName: { fontSize: 20, fontWeight: '700', color: '#0E3D59', flex: 1, minWidth: 100 },
    companyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DDEFF8',
        gap: 4,
        flexShrink: 1,
        maxWidth: '50%',
    },
    companyBadgeText: { fontSize: 12, fontWeight: '700', color: '#0E3D59', flexShrink: 1 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 13, color: '#357B97', fontWeight: '500' },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        flexWrap: 'wrap',
        gap: 8,
    },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoText: { fontSize: 13, color: '#357B97' },
    categoryText: { fontSize: 13, color: '#357B97', fontWeight: '500' },
    description: { fontSize: 14, color: '#357B97', lineHeight: 20, marginBottom: 12 },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 14,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EAF5FB',
    },
    tag: { backgroundColor: '#EAF5FB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    tagText: { fontSize: 11, color: '#357B97', fontWeight: '500' },
    moreText: { fontSize: 11, color: '#357B97', fontStyle: 'italic' },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EAF5FB',
    },
    detailsButton: {
        backgroundColor: '#0E3D59',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    detailsButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
    skeletonContainer: {
        flex: 1,
        backgroundColor: '#F3F9FC',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 90,
    },
    skeletonTabs: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    skeletonPill: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#E8F1F5',
    },
    skeletonLight: {
        opacity: 0.9,
    },
    skeletonCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EAF3F8',
    },
    skeletonImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#E8F1F5',
    },
    skeletonBody: {
        padding: 16,
    },
    skeletonLine: {
        height: 14,
        borderRadius: 8,
        backgroundColor: '#E8F1F5',
        marginBottom: 10,
    },
    skeletonShort: {
        width: '35%',
    },
    skeletonMedium: {
        width: '58%',
    },
    skeletonLong: {
        width: '82%',
    },
    skeletonRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 10,
    },
    skeletonChip: {
        width: 90,
        height: 26,
        borderRadius: 12,
        backgroundColor: '#E8F1F5',
    },
    skeletonShimmer: {
        shadowColor: '#000000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    loadingText: { marginTop: 12, color: '#357B97', fontSize: 16 },
    errorTitle: { fontSize: 20, fontWeight: '700', color: '#991b1b', marginTop: 12 },
    errorText: {
        color: '#357B97',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
        lineHeight: 20,
    },
    troubleshootContainer: {
        backgroundColor: '#fef3c7',
        padding: 16,
        borderRadius: 10,
        marginVertical: 12,
        width: '100%',
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    troubleshootTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 8 },
    troubleshootText: { fontSize: 12, color: '#78350f', marginBottom: 4, lineHeight: 18 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    retryButton: {
        backgroundColor: '#0E3D59',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    retryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0E3D59', marginTop: 16 },
    emptyText: {
        fontSize: 14,
        color: '#357B97',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    debugText: {
        fontSize: 12,
        color: '#357B97',
        marginTop: 12,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});