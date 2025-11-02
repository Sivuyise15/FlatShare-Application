import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from "react";
import { FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function HomeScreen() {
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [imageLoadErrors, setImageLoadErrors] = useState<{ [key: string]: boolean }>({});
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('All');

    const filters = [
        { label: 'All', value: 'All' },
        { label: 'Selling', value: 'selling' },
        { label: 'Renting', value: 'renting' },
        { label: 'Donating', value: 'donating' },
        { label: 'Requesting', value: 'requesting' },
        { label: 'Barter', value: 'swapping' },
        { label: 'Loaning', value: 'loaning' },
        { label: 'Service', value: 'service' },
        { label: 'Lost & Found', value: 'lost & found' },
        { label: 'Other', value: 'other' }
    ];

    // Filter posts based on selected filter
    useEffect(() => {
        if (selectedFilter === 'All') {
            setFilteredPosts(posts);
        } else {
            const filtered = posts.filter(post => post.type === selectedFilter);
            setFilteredPosts(filtered);
        }
    }, [posts, selectedFilter]);

    // Real-time listener for Firestore changes
    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
    try {
        setRefreshing(true);
        const token = await AsyncStorage.getItem("authToken");
        const userCommunity = await AsyncStorage.getItem("userCommunity");
        
        const response = await fetch(`https://flatshare-final.onrender.com/listings?community=${userCommunity}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });
        
        const result = await response.json();
        if (response.ok) {
        setPosts(result.data || []);
        }
    } catch (err) {
        console.error("Error fetching posts:", err);
    } finally {
        setRefreshing(false);
        }
    };

    const handleImageError = (uri: string) => {
        console.log("Image failed to load:", uri);
        setImageLoadErrors(prev => ({ ...prev, [uri]: true }));
    };

    const renderItem = ({ item }: { item: any }) => {
        const typeMap: Record<string, { tag: string; tagColor: string }> = {
            selling:    { tag: 'Sell', tagColor: '#4f2e91' },
            renting:    { tag: 'Rent', tagColor: '#320293' },
            donating:   { tag: 'Donate', tagColor: '#ffe066' },
            requesting: { tag: 'Request', tagColor: '#23b3c7' },
            swapping:   { tag: 'Swap', tagColor: '#4f46e5' },
            loaning:    { tag: 'Loan', tagColor: '#b2e06b' },
            service:    { tag: 'Service', tagColor: '#fbbf24' },
            other:      { tag: 'Other', tagColor: '#8a8d9f' },
            barter:     { tag: 'Barter', tagColor: '#4f46e5' },
            lend:       { tag: 'Lend', tagColor: '#b2e06b' },
            'lost & found': {tag: 'lost & found', tagColor: '#b2e'},
        };
    
        const typeKey = (item.type || '').toLowerCase();
        const typeInfo = typeMap[typeKey] || { tag: '', tagColor: '#ccc' };
    
        console.log(" Rendering item:", { 
            id: item.id, 
            title: item.title,
            price: item.price,
            description: item.description,
            hasImage: !!item.image,
            userId: item.userId,
            userName: item.userName 
        });
    
        return (
            <TouchableOpacity style={styles.card}
                onPress={() => {
                    router.push(
                        {
                            pathname: '../listing-details',
                            params: { 
                                id: item.id,
                                image: item.image ? encodeURIComponent(item.image) : null,  }
                        }
                    );
                    console.log("Card pressed, navigate to details with item:", item);
                }}
            >
                
                <View style={styles.imageWrapper}>
                    {typeInfo.tag ? (
                        <View style={[styles.tag, { backgroundColor: typeInfo.tagColor }]}>
                            <Text style={styles.tagText}>{typeInfo.tag}</Text>
                        </View>
                    ) : null}
                    {item.image && !imageLoadErrors[item.image] ? (
                        <Image
                            source={{ uri: item.image }}
                            style={styles.cardImage}
                            onError={() => handleImageError(item.image)}
                        />
                    ) : (
                        <View style={[styles.cardImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="image" size={32} color="#bbb" />
                            <Text style={{ fontSize: 10, color: '#999', marginTop: 5 }}>No image</Text>
                        </View>
                    )}
                </View>
    
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title || 'No Title'}
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                        {item.description || 'No description available.'}
                    </Text>
                    
                    {(typeKey === 'selling' || typeKey === 'renting' || typeKey === 'loaning' || typeKey === 'barter') && item.price > 0 && (
                        <Text style={styles.cardPrice}>R{item.price}</Text>
                    )}
                </View>
    
                <View style={styles.cardFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.userName}>
                            {item.userName || 'Unknown User'}
                        </Text>
                    </View>
                    <Image
                        source={{ uri: item.userAvatar || item.avatar || 'https://randomuser.me/api/portraits/women/44.jpg' }}
                        style={styles.cardAvatar}
                        onError={() => console.log("Avatar failed to load")}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fafbfc', marginBottom: 70 }}>
            <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={20} color="#8a8d9f" style={{ marginLeft: 12, marginRight: 6 }} />
                <Text style={styles.searchInput}>Search items...</Text>
                <TouchableOpacity onPress={fetchPosts} style={{ padding: 8, marginRight: 8 }}>
                    <Ionicons name="refresh" size={20} color="#8a8d9f" />
                </TouchableOpacity>
            </View>

            {/* Filter Bar */}
            <View style={styles.filterContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.filterScrollContainer}
                >
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter.value}
                            style={[
                                styles.filterButton,
                                selectedFilter === filter.value && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedFilter(filter.value)}
                        >
                            {filter.value === 'All' && (
                                <Ionicons 
                                    name="funnel" 
                                    size={16} 
                                    color={selectedFilter === filter.value ? '#FFFFFF' : '#6B7280'} 
                                    style={styles.filterIcon}
                                />
                            )}
                            <Text style={[
                                styles.filterButtonText,
                                selectedFilter === filter.value && styles.filterButtonTextActive
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredPosts}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 12 }}
                contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchPosts} />
                }
                ListEmptyComponent={
                    <View style={{ alignItems: "center", marginTop: 50, padding: 20 }}>
                        <Ionicons name="images-outline" size={48} color="#ccc" />
                        <Text style={{ marginTop: 10, color: '#666' }}>
                            {selectedFilter === 'All' ? 'No posts yet.' : `No ${selectedFilter} posts found.`}
                        </Text>
                        <Text style={{ color: '#999', fontSize: 12 }}>
                            {selectedFilter === 'All' ? 'Add your first listing!' : 'Try selecting a different filter.'}
                        </Text>
                    </View>
                }
                ListHeaderComponent={
                    filteredPosts.length > 0 ? (
                        <Text style={styles.sectionTitle}>
                            {selectedFilter === 'All' 
                                ? 'Recent Listings' 
                                : `${filters.find(f => f.value === selectedFilter)?.label || selectedFilter} Listings`
                            }
                        </Text>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#fafbfc',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#22223b',
        letterSpacing: 0.5,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eee',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        height: 44,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    searchInput: {
        color: '#8a8d9f',
        fontSize: 16,
        flex: 1,
        paddingLeft: 4,
        fontWeight: '400',
    },
    filterContainer: {
        paddingVertical: 8,
        backgroundColor: '#fafbfc',
    },
    filterScrollContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterButtonActive: {
        backgroundColor: '#4C1D95',
        borderColor: '#4C1D95',
    },
    filterIcon: {
        marginRight: 6,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    filterButtonTextActive: {
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 16,
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        width: '48%',  // keeps 2 cards per row
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: 120,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f6f6f6',
    },
    tag: {
        position: 'absolute',
        top: 10,
        left: 10,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 2,
        zIndex: 2,
    },
    tagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardContent: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 8,
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: '#555',
        marginBottom: 8,
        lineHeight: 16,
    },
    cardPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4f2e91',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    userName: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    cardAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ddd',
    },
    cardStatus: {
        fontSize: 13,
        fontWeight: '500',
    },
});