import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getModuleData } from '../../services/api/modules/crud/indexAPI';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RefreshableScrollView from '../../components/RefreshableScrollView';

const IndexScreen = ({ route, navigation }) => {
	const { moduleName } = route.params;
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredData, setFilteredData] = useState([]);
	const [expandedRows, setExpandedRows] = useState(new Set());
	const [refreshing, setRefreshing] = useState(false);

	const toggleRow = (index) => {
		const newExpandedRows = new Set(expandedRows);
		if (newExpandedRows.has(index)) {
			newExpandedRows.delete(index);
		} else {
			newExpandedRows.add(index);
		}
		setExpandedRows(newExpandedRows);
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const result = await getModuleData(moduleName);
				setData(result);

				if (result && Array.isArray(result) && result.length > 0) {
					setFilteredData(result);
				} else {
					setFilteredData([]);
				}
			} catch (e) {
				setError(e.message);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [moduleName, refreshing]);

	useEffect(() => {
		if (data && Array.isArray(data)) {
			if (searchQuery === '') {
				setFilteredData(data);
			} else {
				const lowercasedQuery = searchQuery.toLowerCase();
				const filtered = data.filter(item => {
					return item.fields.some(field => {
						const value = String(field.value || '').toLowerCase();
						return value.includes(lowercasedQuery);
					});
				});
				setFilteredData(filtered);
			}
		} else {
			setFilteredData([]);
		}
	}, [searchQuery, data]);

	const renderRecordDetails = (item) => {
		const detailFields = item.fields;



		const getDisplayValue = (field) => {
			if (field.fieldname === 'assigned_user_id' && field.userMap) {
				return field.userMap[field.value] || field.value;
			}
			if (!field.value) return <Text style={styles.emptyValue}>Not set</Text>;
			return String(field.value);
		};

		const recordId = detailFields.find(f => f.fieldname === 'id')?.value;




		return (
			<View style={styles.detailsContainer}>
				{/* Scrollable content area */}
				<ScrollView
					style={styles.detailsScrollView}
					contentContainerStyle={styles.detailsScrollContent}
					showsVerticalScrollIndicator={true}
					nestedScrollEnabled={true}
				>

					{detailFields.map((field, idx) => {

						return (
							<View key={idx} style={styles.detailRow}>
								<Text style={styles.detailLabel}>{field.label}:</Text>
								<Text style={styles.detailValue}>{getDisplayValue(field)}</Text>
							</View>
						);
					})}

				</ScrollView>

				{/* Fixed Update button at the bottom */}
				<View style={styles.fixedButtonContainer}>

					<TouchableOpacity
						style={styles.updateButton}
						onPress={() => navigation.navigate('ViewScreen', {
							moduleName,
							recordId
						})}
					>
						<Icon name="visibility" size={18} color="#ffffff" />
						<Text style={styles.updateButtonText}>View Details</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	const renderRecordRow = (item, index) => {
		const mainField = item.fields.find(f => f.value) || { value: '?' };
		const mainLabel = String(mainField.value);
		const initial = mainLabel.charAt(0).toUpperCase();
		const isExpanded = expandedRows.has(index);

		return (
			<View key={index}>
				<TouchableOpacity
					style={[
						styles.recordRow,
						index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
						index === filteredData.length - 1 && !isExpanded && styles.tableRowLast
					]}
					onPress={() => toggleRow(index)}
					activeOpacity={0.7}
				>
					<View style={styles.recordRowContent}>
						<View style={styles.recordInfo}>
							<View style={styles.avatarCircle}>
								<Text style={styles.avatarText}>{initial}</Text>
							</View>
							<Text style={styles.recordLabel}>
								{mainLabel} {item.fields[1]?.value && !item.fields[1]?.type?.includes('date') && !item.fields[1]?.type?.includes('time') ? ` ${item.fields[1].value}` : ''}
							</Text>
						</View>
						<View style={styles.assignedToContainer}>
							<Text style={styles.assignedToLabel}>Assigned to:</Text>
							<Text style={styles.assignedToValue}>
								{item.fields.find(f => f.fieldname === 'assigned_user_id')?.userMap?.[item.fields.find(f => f.fieldname === 'assigned_user_id')?.value] ||
									item.fields.find(f => f.fieldname === 'assigned_user_id')?.value ||
									'Unassigned'}
							</Text>
						</View>
						<Icon
							name={isExpanded ? "expand-less" : "expand-more"}
							size={24}
							color="#6b7280"
							style={styles.chevron}
						/>
					</View>
				</TouchableOpacity>
				{isExpanded && renderRecordDetails(item)}
			</View>
		);
	};

	const renderScrollableContent = () => {
		if (loading) {
			return (
				<View style={styles.loaderContainer}>
					<ActivityIndicator size="large" color="#4f46e5" />
					<Text style={styles.loaderText}>Loading {moduleName}...</Text>
				</View>
			);
		}

		if (error) {
			return (
				<View style={styles.errorContainer}>
					<Icon name="error-outline" size={24} color="#ef4444" />
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={() => setRefreshing(!refreshing)}
					>
						<Text style={styles.retryButtonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			);
		}

		if (!filteredData || filteredData.length === 0) {
			return (
				<View style={styles.emptyStateContainer}>
					<Icon name="inbox" size={60} color="#d1d5db" />
					<Text style={styles.emptyStateTitle}>No data found</Text>
					<Text style={styles.emptyStateText}>No {moduleName.toLowerCase()} records are available.</Text>
				</View>
			);
		}

		return (
			<View style={styles.tableContainer}>
				{filteredData.map((item, index) => renderRecordRow(item, index))}
				<View style={styles.tableFooter}>
					<Text style={styles.tableFooterText}>
						{filteredData.length} {filteredData.length === 1 ? 'record' : 'records'} found
					</Text>
				</View>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<Header />

			{/* Fixed Header and Search Section */}
			<View style={styles.fixedHeaderSection}>
				{/* Header Container */}
				<View style={styles.headerContainer}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>{moduleName}</Text>
						<Text style={styles.subtitle}>Manage your {moduleName.toLowerCase()} records</Text>
					</View>
					<TouchableOpacity style={styles.addButton}
						onPress={() => navigation.navigate('CreateScreen', { moduleName })}>
						<Icon name="add" size={22} color="#ffffff" />
						<Text style={styles.addButtonText}>New {moduleName}</Text>
					</TouchableOpacity>
				</View>

				{/* Separate Search Container */}
				<View style={styles.searchSection}>
					<View style={styles.searchContainer}>
						<Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
						<TextInput
							style={styles.searchInput}
							placeholder={`Search in ${moduleName}...`}
							value={searchQuery}
							onChangeText={setSearchQuery}
							placeholderTextColor="#9ca3af"
						/>
						{searchQuery !== '' && (
							<TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
								<Icon name="close" size={20} color="#6b7280" />
							</TouchableOpacity>
						)}
					</View>
				</View>
			</View>

			{/* Scrollable Content Section */}
			<RefreshableScrollView
				style={styles.scrollableContent}
				onRefresh={() => setRefreshing(!refreshing)}
				showsVerticalScrollIndicator={true}
			>
				<View style={styles.moduleContentContainer}>
					{renderScrollableContent()}
				</View>
			</RefreshableScrollView>

			<Footer navigation={navigation} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f9fafb',
		flex: 1,
	},
	fixedHeaderSection: {
		zIndex: 1,
	},
	scrollableContent: {
		flex: 1,
	},
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 20,
		paddingHorizontal: 20,
		backgroundColor: '#ffffff',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	searchSection: {
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	titleContainer: {
		flex: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: '#6b7280',
	},
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#2196F3',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		elevation: 1,
	},
	addButtonText: {
		color: '#ffffff',
		fontWeight: '600',
		marginLeft: 8,
	},

	moduleContentContainer: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 32,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#ffffff',
		borderRadius: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		overflow: 'hidden',
	},
	searchIcon: {
		marginRight: 12,
	},
	searchInput: {
		flex: 1,
		height: 40,
		fontSize: 15,
		color: '#111827',
		padding: 0,
	},
	clearButton: {
		padding: 4,
		marginLeft: 8,
	},
	tableContainer: {
		backgroundColor: '#ffffff',
		borderRadius: 12,
		overflow: 'hidden',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	recordRow: {
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	recordRowContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		paddingHorizontal: 16,
	},
	recordInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 2,
	},
	recordLabel: {
		fontSize: 15,
		color: '#111827',
		fontWeight: '500',
	},
	tableRowEven: {
		backgroundColor: '#ffffff',
	},
	tableRowOdd: {
		backgroundColor: '#f9fafb',
	},
	tableRowLast: {
		borderBottomWidth: 0,
	},
	tableFooter: {
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: '#e5e7eb',
		backgroundColor: '#f9fafb',
	},
	tableFooterText: {
		fontSize: 13,
		fontWeight: '500',
		color: '#6b7280',
		textAlign: 'right',
	},
	loaderContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 60,
		backgroundColor: '#ffffff',
		borderRadius: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	loaderText: {
		marginTop: 16,
		fontSize: 15,
		color: '#6b7280',
	},
	emptyStateContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 60,
		backgroundColor: '#ffffff',
		borderRadius: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	emptyStateTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#374151',
		marginTop: 16,
		marginBottom: 8,
	},
	emptyStateText: {
		fontSize: 15,
		color: '#6b7280',
		textAlign: 'center',
	},
	errorContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fef2f2',
		padding: 24,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#fee2e2',
	},
	errorText: {
		marginTop: 12,
		marginBottom: 16,
		fontSize: 15,
		color: '#b91c1c',
		textAlign: 'center',
	},
	retryButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		backgroundColor: '#ffffff',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#ef4444',
	},
	retryButtonText: {
		color: '#ef4444',
		fontWeight: '600',
		fontSize: 14,
	},
	chevron: {
		width: 24,
		height: 24,
	},


	detailsContainer: {
		backgroundColor: '#f3f4f6',
		height: 600,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
		marginBottom: 8,
	},

	detailsScrollView: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},

	detailsScrollContent: {
		paddingBottom: 16,
	},

	detailRow: {
		flexDirection: 'row',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},

	detailLabel: {
		flex: 1,
		fontSize: 14,
		color: '#4b5563',
		fontWeight: '500',
	},

	detailValue: {
		flex: 2,
		fontSize: 14,
		color: '#111827',
	},

	emptyValue: {
		fontStyle: 'italic',
		color: '#9ca3af',
	},

	fixedButtonContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: '#e5e7eb',
		backgroundColor: '#ffffff',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},

	updateButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 24,
		backgroundColor: '#2196F3',
		borderRadius: 6,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.15,
		shadowRadius: 3,
		elevation: 2,
	},

	updateButtonText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#ffffff',
		marginLeft: 8,
		letterSpacing: 0.3,
	},



	assignedToContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 2,
		justifyContent: 'flex-start',
		paddingHorizontal: 8,
	},
	assignedToLabel: {
		fontSize: 14,
		color: '#6b7280',
		marginRight: 4,
	},
	assignedToValue: {
		fontSize: 14,
		color: '#111827',
		fontWeight: '500',
	},
	avatarCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#eef2ff',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		borderWidth: 1,
		borderColor: '#e0e7ff',
	},
	avatarText: {
		color: '#4f46e5',
		fontSize: 16,
		fontWeight: '600',
	},
});

export default IndexScreen;