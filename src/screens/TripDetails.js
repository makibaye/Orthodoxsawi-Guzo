// src/screens/TripDetails.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Image,
    Dimensions,
    Linking,
    Alert,
    Share,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// API Configuration - Match with ToursListScreen
const API_CONFIG = {
    BASE_URL: 'https://orthodoxawiguzo.com/Admin',
};

// Helper function to get image URL from image path
const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's already a full URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // Clean up the path - remove any leading slashes
    let cleanPath = imagePath.replace(/^\/+/, '');

    // Get just the filename
    let filename = cleanPath.split('/').pop();

    // Construct the URL with Back End folder
    return `${API_CONFIG.BASE_URL}/uploads/trips/${filename}`;
};

export default function TripDetails({ navigation, route }) {
    const { trip } = route.params || {};
    const [expandedItinerary, setExpandedItinerary] = useState(false);
    const [imageError, setImageError] = useState(false);

    if (!trip) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Icon name="alert-circle-outline" size={60} color="#ef4444" />
                    <Text style={styles.errorText}>Trip details not found</Text>
                    <TouchableOpacity
                        style={styles.goBackButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.goBackButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Get the image URL using the helper function
    const imageUrl = getImageUrl(trip.image);
    const hasImage = imageUrl && !imageError;

    const formatDate = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateString || 'N/A';
        }
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
            case 'active': return 'checkmark-circle';
            case 'completed': return 'checkmark-done-circle';
            case 'cancelled': return 'close-circle';
            default: return 'ellipse';
        }
    };

    const getTourTypeIcon = (type) => {
        return type === 'local' ? 'location' : 'earth';
    };

    const handleShare = async () => {
        try {
            const message = `✈️ ${trip.name}\n\n📍 From: ${trip.fromCity}\n📅 Date: ${formatDate(trip.departureDate)}\n⏱️ Duration: ${trip.duration}\n💰 Price: $${parseFloat(trip.price).toFixed(2)}\n\n${trip.description || ''}`;
            await Share.share({
                message: message,
                title: trip.name,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleCall = () => {
        Alert.alert(
            'Contact Us',
            'Would you like to call us for more information about this trip?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call', onPress: () => Linking.openURL('tel:+251911465991') }
            ]
        );
    };

    const handleBookNow = () => {
        navigation.navigate('Payment', { trip });
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0E3D59" />

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Hero Image Section */}
                <View style={styles.heroContainer}>
                    {hasImage ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.heroImage}
                            onError={() => {
                                console.log('❌ Image failed to load:', imageUrl);
                                setImageError(true);
                            }}
                        />
                    ) : (
                        <View style={[styles.heroImage, styles.heroPlaceholder]}>
                            <Icon name="image-outline" size={80} color="#9DC8E1" />
                            <Text style={styles.heroPlaceholderText}>No Image Available</Text>
                        </View>
                    )}

                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradientOverlay}
                    />

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                        <Icon name={getStatusIcon(trip.status)} size={14} color="#fff" />
                        <Text style={styles.statusText}>{trip.status?.toUpperCase() || 'UNKNOWN'}</Text>
                    </View>

                    {/* Title and Type Overlay */}
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>{trip.name}</Text>
                        <View style={styles.heroTypeContainer}>
                            <Icon name={getTourTypeIcon(trip.tourType)} size={16} color="#fff" />
                            <Text style={styles.heroType}>
                                {trip.tourType?.charAt(0).toUpperCase() + trip.tourType?.slice(1) || 'N/A'}
                            </Text>
                            <View style={styles.heroCategoryBadge}>
                                <Text style={styles.heroCategory}>{trip.tourCategory}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.content}>

                    {/* Price Section */}
                    <View style={styles.priceSection}>
                        <View style={styles.priceLeft}>
                            <Text style={styles.priceLabel}>Price per person</Text>
                            <Text style={styles.priceValue}>{parseFloat(trip.price)} Birr</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.bookNowButton}
                            onPress={handleBookNow}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.bookNowText}>Book</Text>
                            <Icon name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📝 Description</Text>
                        <Text style={styles.descriptionText}>
                            {trip.description || 'No description available for this trip.'}
                        </Text>
                    </View>

                    {/* Itinerary */}
                    {trip.itinerary && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🗺️ Itinerary</Text>
                            <Text style={styles.itineraryText}>
                                {expandedItinerary
                                    ? trip.itinerary
                                    : trip.itinerary.length > 150
                                        ? trip.itinerary.substring(0, 150) + '...'
                                        : trip.itinerary
                                }
                            </Text>
                            {trip.itinerary.length > 150 && (
                                <TouchableOpacity
                                    onPress={() => setExpandedItinerary(!expandedItinerary)}
                                    style={styles.readMoreButton}
                                >
                                    <Text style={styles.readMoreText}>
                                        {expandedItinerary ? 'Show Less' : 'Read More'}
                                    </Text>
                                    <Icon
                                        name={expandedItinerary ? 'chevron-up' : 'chevron-down'}
                                        size={16}
                                        color="#0E3D59"
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* What's Included */}
                    {trip.includes && trip.includes.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>✅ What's Included</Text>
                            {trip.includes.map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Icon name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={styles.listItemText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* What's Excluded */}
                    {trip.excludes && trip.excludes.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>❌ What's Excluded</Text>
                            {trip.excludes.map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Icon name="close-circle" size={20} color="#ef4444" />
                                    <Text style={styles.listItemText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Contact Section */}
                    <View style={styles.contactSection}>
                        <Text style={styles.contactTitle}>Need Help?</Text>
                        <Text style={styles.contactSubtitle}>
                            Have questions about this trip? We're here to help!
                        </Text>
                        <View style={styles.contactButtons}>
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={handleCall}
                            >
                                <Icon name="call-outline" size={20} color="#0E3D59" />
                                <Text style={styles.contactButtonText}>Call Us</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.contactButton, styles.contactButtonPrimary]}
                                onPress={() => {
                                    Alert.alert('Contact', 'Contact support functionality coming soon!');
                                }}
                            >
                                <Icon name="chatbubble-outline" size={20} color="#fff" />
                                <Text style={[styles.contactButtonText, styles.contactButtonTextPrimary]}>
                                    Chat Support
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom Spacer */}
                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0E3D59',
    },
    container: {
        flex: 1,
        backgroundColor: '#F3F9FC',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 0 : 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25
    },
    shareButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContainer: {
        width: width,
        height: height * 0.45,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroPlaceholder: {
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroPlaceholderText: {
        fontSize: 14,
        color: '#69ABCC',
        marginTop: 8,
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    statusBadge: {
        position: 'absolute',
        top: 70,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
        zIndex: 5,
    },
    statusText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    heroContent: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        zIndex: 5,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    heroTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroType: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    heroCategoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    heroCategory: {
        fontSize: 11,
        color: '#ffffff',
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    content: {
        flex: 1,
        backgroundColor: '#F3F9FC',
        marginTop: -15,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    quickInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    quickInfoCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    quickInfoLabel: {
        fontSize: 10,
        color: '#69ABCC',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    quickInfoValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0E3D59',
        marginTop: 2,
        textAlign: 'center',
    },
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    priceLeft: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: '#69ABCC',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0E3D59',
    },
    bookNowButton: {
        backgroundColor: '#0E3D59',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#0E3D59',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bookNowText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0E3D59',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 15,
        color: '#357B97',
        lineHeight: 24,
    },
    itineraryText: {
        fontSize: 15,
        color: '#357B97',
        lineHeight: 24,
    },
    readMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    readMoreText: {
        fontSize: 14,
        color: '#0E3D59',
        fontWeight: '600',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    listItemText: {
        fontSize: 15,
        color: '#0E3D59',
        flex: 1,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    infoGridItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f8f6f1',
        padding: 12,
        borderRadius: 10,
    },
    infoGridLabel: {
        fontSize: 11,
        color: '#69ABCC',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoGridValue: {
        fontSize: 14,
        color: '#0E3D59',
        fontWeight: '600',
    },
    statusIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusIndicatorText: {
        fontSize: 11,
        color: '#ffffff',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    contactSection: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    contactTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0E3D59',
        marginBottom: 4,
    },
    contactSubtitle: {
        fontSize: 14,
        color: '#357B97',
        textAlign: 'center',
        marginBottom: 16,
    },
    contactButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0E3D59',
        gap: 8,
    },
    contactButtonPrimary: {
        backgroundColor: '#0E3D59',
        borderColor: '#0E3D59',
    },
    contactButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0E3D59',
    },
    contactButtonTextPrimary: {
        color: '#ffffff',
    },
    bottomSpacer: {
        height: 40,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F3F9FC',
    },
    errorText: {
        fontSize: 18,
        color: '#0E3D59',
        marginTop: 12,
        marginBottom: 20,
    },
    goBackButton: {
        backgroundColor: '#0E3D59',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    goBackButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});