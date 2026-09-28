import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    Modal,
    FlatList,
    ScrollView,
    SafeAreaView,
    StatusBar,
    LogBox,
    TextInput,
    Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

// Ignore warnings if needed
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

// API Configuration - Update with your IP
const API_CONFIG = {
    BASE_URL: 'https://orthodoxawiguzo.com/Admin', // Replace with your IP
    ENDPOINTS: {
        GET_CHURCHES: '/api_churches.php',
        SEARCH_TRIPS: '/api_trips_search.php',
    }
};

export default function HomeScreen({ navigation }) {
    const [location, setLocation] = useState(null);
    const [churches, setChurches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [tourTypeModalVisible, setTourTypeModalVisible] = useState(false);
    const [selectedChurch, setSelectedChurch] = useState(null);
    const [selectedTourType, setSelectedTourType] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Search states
    const [searchFromCity, setSearchFromCity] = useState('አዲስ አበባ');
    const [searchDestination, setSearchDestination] = useState('');
    const [searchTourCategory, setSearchTourCategory] = useState('');
    const [tourCategoryModalVisible, setTourCategoryModalVisible] = useState(false);

    // Error state
    const [error, setError] = useState(null);

    const tourTypes = [
        { id: 'local', label: '🌍 ሀገር ዉስጥ' },
        { id: 'international', label: '✈️ ከሀገር ዉጭ' }
    ];

    const tourCategories = [
        { id: 'derso mels', label: '🏛️ ደርሶ መልስ' },
        { id: 'adar', label: '🌿 አዳር' },
    ];

    // Hide header
    const resetSearchForm = React.useCallback(() => {
        setSelectedChurch(null);
        setSelectedTourType(null);
        setSelectedDate(new Date());
        setShowDatePicker(false);
        setModalVisible(false);
        setTourTypeModalVisible(false);
        setSearchFromCity('አዲስ አበባ');
        setSearchDestination('');
        setSearchTourCategory('');
        setTourCategoryModalVisible(false);
    }, []);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, [navigation]);

    useFocusEffect(
        React.useCallback(() => {
            resetSearchForm();
        }, [resetSearchForm])
    );

    // Fetch churches from API
    const fetchChurches = async () => {
        try {
            setLoading(true);
            setError(null);

            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_CHURCHES}`;
            console.log('📡 Fetching churches from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });

            const rawText = await response.text();
            console.log('🔗 Raw response:', rawText.substring(0, 200));

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseErr) {
                console.error('❌ JSON Parse Error:', parseErr);
                // Use mock data as fallback
                setLoading(false);
                return;
            }

            if (data.success && Array.isArray(data.data)) {
                // Map API response to church format
                const churchList = data.data.map((item, index) => ({
                    id: item.id || index + 1,
                    name: item.destination,
                    address: item.from_city || 'አዲስ አበባ',
                    description: item.description || '',
                    // Store additional data for filtering
                    from_city: item.from_city,
                    tour_type: item.tour_type,
                    tour_category: item.tour_category,
                    departure_date: item.departure_date
                }));

                // Remove duplicates by name
                const uniqueChurches = [];
                const seenNames = new Set();
                for (let church of churchList) {
                    if (!seenNames.has(church.name)) {
                        seenNames.add(church.name);
                        uniqueChurches.push(church);
                    }
                }

                setChurches(uniqueChurches);
                console.log('✅ Loaded', uniqueChurches.length, 'churches');
            } else {
                // Use mock data if API returns error
                console.warn('⚠️ Using mock churches data');

            }
        } catch (err) {
            console.error('❌ Fetch error:', err);
            // Use mock data as fallback

            setError('Could not load churches. Using sample data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Set default location
        setLocation({
            coords: {
                latitude: 9.03,
                longitude: 38.74
            },
            city: 'አዲስ አበባ'
        });

        // Fetch churches from API
        fetchChurches();
    }, []);

    const handleSelectChurch = (church) => {
        setSelectedChurch(church.id);
        setSearchDestination(church.name);
        setModalVisible(false);
    };

    const handleSelectTourType = (typeId) => {
        setSelectedTourType(typeId);
        setTourTypeModalVisible(false);
    };

    const handleSelectTourCategory = (categoryId) => {
        setSearchTourCategory(categoryId);
        setTourCategoryModalVisible(false);
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setSelectedDate(selectedDate);
        }
    };

    const handleSearch = () => {
        if (!searchDestination && !selectedChurch) {
            Alert.alert('Missing Information', 'Please select a destination church.');
            return;
        }

        const formattedDate = selectedDate.toISOString().split('T')[0];

        navigation.navigate('Tours', {
            fromCity: searchFromCity,
            destination: searchDestination || selectedChurchName,
            departureDate: formattedDate,
            tourType: selectedTourType || 'all',
            tourCategory: searchTourCategory || 'all',
            churchId: selectedChurch,
            currentLocation: location?.coords,
            currentLocation: location?.coords,
            currentCity: location?.city,
            date: selectedDate
        });
    };

    const selectedChurchName = churches.find(ch => ch.id === selectedChurch)?.name || 'የገዳማት ዝርዝር';
    const selectedTourTypeLabel = tourTypes.find(t => t.id === selectedTourType)?.label || 'ሀገር ዉስጥ /ከሀገር ዉጭ';
    const selectedTourCategoryLabel = tourCategories.find(c => c.id === searchTourCategory)?.label || 'አዳር /ደርሶ መልስ';
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar backgroundColor="#0E3D59" barStyle="light-content" />

                <LinearGradient
                    colors={['#0E3D59', '#174F71', '#69ABCC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.topcontainer}
                >
                    <View style={styles.logoContainer}>
                        <View style={[styles.skeletonLogo, styles.skeletonShimmer]} />
                        <View style={[styles.skeletonTitle, styles.skeletonShimmer]} />
                        <View style={[styles.skeletonSubtitle, styles.skeletonShimmer]} />
                    </View>
                </LinearGradient>

                <View style={styles.contentContainer}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.cardContainer}>
                            {[1, 2, 3, 4].map((item) => (
                                <View key={item} style={styles.skeletonGroup}>
                                    <View style={[styles.skeletonLabel, styles.skeletonShimmer]} />
                                    <View style={[styles.skeletonInput, styles.skeletonShimmer]} />
                                </View>
                            ))}

                            <View style={[styles.skeletonButton, styles.skeletonShimmer]} />
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#0E3D59" barStyle="light-content" />

            <LinearGradient
                colors={['#0E3D59', '#174F71', '#69ABCC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topcontainer}
            >
            

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../Asset/logo.jpeg')}
                        style={styles.logo}
                        onError={(e) => console.log('❌ Logo image error:', e.nativeEvent.error)}
                    />
                    <Text style={styles.companyName}>ኦርቶዶክሳዊ ጉዞ</Text>
                    <Text style={styles.companyTag}>ኦርቶዶክሳዊ ስነ-ምግባርን በጠበቀ መልኩ!</Text>
                </View>
            </LinearGradient>

            <View style={styles.contentContainer}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.cardContainer}>
                        {/* From (Current Location) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Ionicons name="location-outline" size={14} color="#0E3D59" /> መነሻ
                            </Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="location-outline" size={20} color="#0E3D59" />
                                <TextInput
                                    style={styles.inputText}
                                    value={searchFromCity}
                                    onChangeText={setSearchFromCity}
                                    placeholder="Enter your city"
                                    placeholderTextColor="#69ABCC"
                                />
                                <View style={styles.inputBadge}>
                                    <Text style={styles.badgeText}>📍</Text>
                                </View>
                            </View>
                        </View>

                        {/* Destination - Dynamic from API */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Ionicons name="location-outline" size={14} color="#0E3D59" /> መዳረሻ
                            </Text>
                            <View style={styles.destinationRow}>
                                <TouchableOpacity
                                    style={[styles.dropdownButton, styles.destinationDropdown]}
                                    onPress={() => setModalVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.dropdownLeft}>
                                        <Ionicons name="location-outline" size={22} color="#0E3D59" />
                                        <Text style={[styles.dropdownButtonText, !selectedChurch && styles.placeholderText]}>
                                            {selectedChurchName}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-down-outline" size={24} color="#0E3D59" />
                                </TouchableOpacity>
                                {selectedChurch && (
                                    <TouchableOpacity
                                        style={styles.clearDestinationBtn}
                                        onPress={() => {
                                            setSelectedChurch(null);
                                            setSearchDestination('');
                                        }}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#69ABCC" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {error && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}
                        </View>

                        {/* Date */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Ionicons name="calendar-outline" size={14} color="#0E3D59" /> ቀን
                            </Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.dropdownLeft}>
                                    <Ionicons name="calendar-outline" size={22} color="#0E3D59" />
                                    <Text style={styles.dropdownButtonText}>
                                        {formattedDate}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down-outline" size={24} color="#0E3D59" />
                            </TouchableOpacity>
                        </View>

                        {/* Tour Type */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Ionicons name="compass-outline" size={14} color="#0E3D59" /> የጉዞ አይነት
                            </Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setTourTypeModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.dropdownLeft}>
                                    <Ionicons name="compass-outline" size={22} color="#0E3D59" />
                                    <Text style={[styles.dropdownButtonText, !selectedTourType && styles.placeholderText]}>
                                        {selectedTourTypeLabel}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down-outline" size={24} color="#0E3D59" />
                            </TouchableOpacity>
                        </View>

                        {/* Tour Category */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Ionicons name="pricetag-outline" size={14} color="#0E3D59" /> የጉዞ እርዝማኔ
                            </Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setTourCategoryModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.dropdownLeft}>
                                    <Ionicons name="pricetag-outline" size={22} color="#0E3D59" />
                                    <Text style={[styles.dropdownButtonText, !searchTourCategory && styles.placeholderText]}>
                                        {selectedTourCategoryLabel}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down-outline" size={24} color="#0E3D59" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, (!selectedChurch) && styles.buttonDisabled]}
                            onPress={handleSearch}
                            disabled={!selectedChurch}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.buttonText}>Search Tours</Text>
                            <Ionicons name="search-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            {/* Church Dropdown Modal - Dynamic from API */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>የገዳማት ዝርዝር</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close-outline" size={28} color="#0E3D59" />
                            </TouchableOpacity>
                        </View>

                        {churches.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="location-outline" size={48} color="#69ABCC" />
                                <Text style={styles.emptyText}>No churches available</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={churches}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.modalItem,
                                            selectedChurch === item.id && styles.modalItemSelected
                                        ]}
                                        onPress={() => handleSelectChurch(item)}
                                        activeOpacity={0.6}
                                    >
                                        <View style={styles.modalItemContent}>
                                            <View style={styles.churchIconContainer}>
                                                <Ionicons name="location-outline" size={24} color="#0E3D59" />
                                            </View>
                                            <View style={styles.modalItemTextContainer}>
                                                <Text style={[
                                                    styles.modalItemText,
                                                    selectedChurch === item.id && styles.modalItemTextSelected
                                                ]}>
                                                    {item.name}
                                                </Text>
                                            </View>
                                            {selectedChurch === item.id && (
                                                <View style={styles.checkmarkContainer}>
                                                    <Ionicons name="checkmark-circle" size={24} color="#0E3D59" />
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.modalList}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Tour Type Dropdown Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={tourTypeModalVisible}
                onRequestClose={() => setTourTypeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>ሀገር ዉስጥ /ከሀገር ዉጭ</Text>
                            <TouchableOpacity
                                onPress={() => setTourTypeModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close-outline" size={28} color="#0E3D59" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={tourTypes}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        selectedTourType === item.id && styles.modalItemSelected
                                    ]}
                                    onPress={() => handleSelectTourType(item.id)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.modalItemContent}>
                                        <View style={styles.tourTypeIconContainer}>
                                            <Ionicons name="compass-outline" size={24} color="#0E3D59" />
                                        </View>
                                        <View style={styles.modalItemTextContainer}>
                                            <Text style={[
                                                styles.modalItemText,
                                                selectedTourType === item.id && styles.modalItemTextSelected
                                            ]}>
                                                {item.label}
                                            </Text>
                                        </View>
                                        {selectedTourType === item.id && (
                                            <View style={styles.checkmarkContainer}>
                                                <Ionicons name="checkmark-circle" size={24} color="#0E3D59" />
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalList}
                        />
                    </View>
                </View>
            </Modal>

            {/* Tour Category Dropdown Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={tourCategoryModalVisible}
                onRequestClose={() => setTourCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>ደርሶ መልስ /አዳር</Text>
                            <TouchableOpacity
                                onPress={() => setTourCategoryModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close-outline" size={28} color="#0E3D59" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={tourCategories}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        searchTourCategory === item.id && styles.modalItemSelected
                                    ]}
                                    onPress={() => handleSelectTourCategory(item.id)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.modalItemContent}>
                                        <View style={styles.tourTypeIconContainer}>
                                            <Ionicons name="pricetag-outline" size={24} color="#0E3D59" />
                                        </View>
                                        <View style={styles.modalItemTextContainer}>
                                            <Text style={[
                                                styles.modalItemText,
                                                searchTourCategory === item.id && styles.modalItemTextSelected
                                            ]}>
                                                {item.label}
                                            </Text>
                                        </View>
                                        {searchTourCategory === item.id && (
                                            <View style={styles.checkmarkContainer}>
                                                <Ionicons name="checkmark-circle" size={24} color="#0E3D59" />
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalList}
                        />
                    </View>
                </View>
            </Modal>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#EEF7FB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: '#357B97',
        fontSize: 16,
    },
    topcontainer: {
        paddingTop: 18,
        paddingBottom: 28,
        paddingHorizontal: 18,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#0E3D59',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.17)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    userWelcome: {
        marginLeft: 10,
    },
    welcomeLabel: {
        color: '#D7EEF8',
        fontSize: 8,
        letterSpacing: 0.8,
    },
    welcomeText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    statusText: {
        color: '#E8F9FF',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        marginTop: 25,
        width: 96,
        height: 96,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    companyName: {
        color: '#FFFFFF',
        fontSize: 23,
        fontWeight: '800',
        marginTop: 10,
    },
    companyTag: {
        color: '#D9F2FE',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
        letterSpacing: 0.4,
    },
    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        padding: 18,
        marginTop: 18,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    heroSubtitle: {
        color: '#D9F2FE',
        fontSize: 13,
        marginTop: 7,
        lineHeight: 20,
    },
    heroMetrics: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'space-between',
    },
    metricBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginRight: 10,
    },
    metricNumber: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    metricLabel: {
        color: '#D9F2FE',
        fontSize: 11,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: -16,
    },
    scrollContent: {
        paddingBottom: 18,
        paddingTop: 6,
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#0E3D59',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 8,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#E7F2F8',
    },
    inputGroup: {
        marginBottom: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3F627A',
        marginBottom: 6,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4FAFD',
        borderWidth: 1.2,
        borderColor: '#D9EBF5',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 46,
    },
    inputText: {
        fontSize: 11,
        color: '#0E3D59',
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
        padding: 0,
    },
    inputBadge: {
        backgroundColor: '#0E3D59',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
    },
    destinationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    destinationDropdown: {
        flex: 1,
    },
    clearDestinationBtn: {
        padding: 6,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F4FAFD',
        borderWidth: 1.2,
        borderColor: '#D9EBF5',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 11,
        minHeight: 46,
    },
    dropdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dropdownButtonText: {
        fontSize: 12,
        color: '#0E3D59',
        marginLeft: 10,
        flex: 1,
        fontWeight: '600',
    },
    placeholderText: {
        color: '#0E3D59',
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0E3D59',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginTop: 8,
        shadowColor: '#0E3D59',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#B9D5E8',
        shadowOpacity: 0.1,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    buttonIcon: {
        marginLeft: 8,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    helperText: {
        color: '#69ABCC',
        fontSize: 11,
        marginTop: 4,
    },
    skeletonShimmer: {
        backgroundColor: '#E3EEF5',
        opacity: 0.9,
    },
    skeletonLogo: {
        marginTop: 25,
        width: 96,
        height: 96,
        borderRadius: 28,
        backgroundColor: '#D5E7F2',
    },
    skeletonTitle: {
        width: 180,
        height: 20,
        borderRadius: 10,
        marginTop: 14,
        backgroundColor: '#D5E7F2',
    },
    skeletonSubtitle: {
        width: 230,
        height: 12,
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: '#D5E7F2',
    },
    skeletonGroup: {
        marginBottom: 10,
    },
    skeletonLabel: {
        width: 78,
        height: 11,
        borderRadius: 6,
        marginBottom: 6,
        backgroundColor: '#E3EEF5',
    },
    skeletonInput: {
        width: '100%',
        height: 46,
        borderRadius: 14,
        backgroundColor: '#E3EEF5',
    },
    skeletonButton: {
        width: '100%',
        height: 46,
        borderRadius: 16,
        marginTop: 8,
        backgroundColor: '#D5E7F2',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 34,
        maxHeight: '80%',
        minHeight: '40%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EAF4FB',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0E3D59',
    },
    closeButton: {
        padding: 4,
    },
    modalList: {
        paddingBottom: 6,
    },
    modalItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EAF4FB',
    },
    modalItemSelected: {
        backgroundColor: '#F4FAFD',
        borderRadius: 10,
        paddingHorizontal: 6,
        marginHorizontal: -6,
    },
    modalItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    churchIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EAF4FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    tourTypeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EAF4FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    modalItemTextContainer: {
        flex: 1,
    },
    modalItemText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#0E3D59',
    },
    modalItemTextSelected: {
        color: '#0E3D59',
        fontWeight: '600',
    },
    modalItemSubtext: {
        fontSize: 11,
        color: '#69ABCC',
        marginTop: 2,
    },
    checkmarkContainer: {
        marginLeft: 6,
    },
    emptyContainer: {
        padding: 28,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 13,
        color: '#69ABCC',
    },
});