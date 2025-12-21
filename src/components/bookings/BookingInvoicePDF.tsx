import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#1a2332',
    padding: 20,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  invoiceTitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  contentWrapper: {
    padding: 25,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    border: '1 solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1fa89f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: '1 solid #f3f4f6',
  },
  rowNoBorder: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
    fontSize: 10,
    color: '#1f2937',
  },
  section: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    border: '1 solid #e5e7eb',
  },
  serviceTable: {
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1 solid #e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1fa89f',
    padding: 12,
    fontWeight: 'bold',
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottom: '1 solid #f3f4f6',
    backgroundColor: '#ffffff',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '25%',
    textAlign: 'center',
  },
  tableCol3: {
    width: '25%',
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 0,
    backgroundColor: '#1fa89f',
    padding: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  badge: {
    padding: '4 10',
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusUnpaid: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a2332',
    padding: 15,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 1.4,
  },
  notesSection: {
    backgroundColor: '#fefce8',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  notesText: {
    fontSize: 9,
    color: '#854d0e',
    lineHeight: 1.4,
  },
  bankDetailsSection: {
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    border: '1 solid #bfdbfe',
  },
  bankDetailsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bankDetailsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bankDetailsLabel: {
    width: '35%',
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  bankDetailsValue: {
    width: '65%',
    fontSize: 10,
    color: '#1e3a8a',
  },
});

interface BookingInvoicePDFProps {
  booking: {
    id: number;
    date_time: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    address: string;
    postcode: string;
    cleaning_type: string;
    service_type: string;
    total_cost: number;
    total_hours?: number | null;
    payment_status: string;
    additional_details?: string;
  };
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

export const BookingInvoicePDF: React.FC<BookingInvoicePDFProps> = ({ booking, customer }) => {
  const getStatusColor = (status: string) => {
    const lower = status?.toLowerCase() || '';
    if (lower.includes('paid') && !lower.includes('unpaid')) return styles.statusPaid;
    if (lower.includes('unpaid') || lower.includes('failed')) return styles.statusUnpaid;
    return styles.statusPending;
  };

  const humanize = (val?: string | null) => {
    if (!val) return '';
    return val
      .split('_')
      .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
  };

  // Parse additional_details and format as human-readable text
  const formatAdditionalDetails = (details?: string | null): string | null => {
    if (!details) return null;
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(details);
      const parts: string[] = [];
      
      // Handle cleaning products
      if (parsed.cleaningProducts) {
        const products = parsed.cleaningProducts;
        if (products.type === 'products') {
          parts.push('Cleaning products: Customer will provide');
        } else if (products.type === 'bring') {
          parts.push('Cleaning products: Cleaner will bring');
        }
        if (products.arrangement) {
          parts.push(`Arrangement: ${products.arrangement}`);
        }
      }
      
      // Handle access info
      if (parsed.access) {
        const access = parsed.access;
        if (access.method === 'meet') {
          parts.push('Access: Customer will meet cleaner');
        } else if (access.method === 'key') {
          parts.push('Access: Key collection');
        } else if (access.method === 'lockbox') {
          parts.push('Access: Lockbox');
        } else if (access.method) {
          parts.push(`Access: ${access.method}`);
        }
        if (access.notes) {
          parts.push(`Access notes: ${access.notes}`);
        }
      }
      
      // Handle any other string properties
      Object.entries(parsed).forEach(([key, value]) => {
        if (key !== 'cleaningProducts' && key !== 'access' && typeof value === 'string' && value) {
          parts.push(`${humanize(key)}: ${value}`);
        }
      });
      
      return parts.length > 0 ? parts.join('\n') : null;
    } catch {
      // Not JSON, return as-is if it's not empty
      return details.trim() || null;
    }
  };

  const formattedNotes = formatAdditionalDetails(booking.additional_details);

  const bookingDate = booking.date_time 
    ? format(new Date(booking.date_time), 'dd MMMM yyyy')
    : 'N/A';
  
  const bookingTime = booking.date_time 
    ? format(new Date(booking.date_time), 'HH:mm')
    : 'N/A';

  const invoiceNumber = `INV-${booking.id.toString().padStart(6, '0')}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.logo}>SN CLEANING SERVICES</Text>
            <View>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={{ ...styles.invoiceTitle, fontSize: 10 }}>{invoiceNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          {/* Info Grid */}
          <View style={styles.infoGrid}>
            {/* Booking Details */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Booking ID:</Text>
                <Text style={styles.value}>#{booking.id}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{bookingDate}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Time:</Text>
                <Text style={styles.value}>{bookingTime}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Status:</Text>
                <View style={[styles.badge, getStatusColor(booking.payment_status)]}>
                  <Text>{booking.payment_status?.toUpperCase() || 'UNPAID'}</Text>
                </View>
              </View>
            </View>

            {/* Customer Details */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>
                  {customer?.first_name || booking.first_name} {customer?.last_name || booking.last_name}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{customer?.email || booking.email}</Text>
              </View>
              {(customer?.phone || booking.phone_number) && (
                <View style={styles.rowNoBorder}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{customer?.phone || booking.phone_number}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Service Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Address</Text>
            <Text style={styles.value}>
              {booking.address}{'\n'}
              {booking.postcode}
            </Text>
          </View>

          {/* Service Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            
            <View style={styles.serviceTable}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol1, styles.tableHeaderText]}>Description</Text>
                <Text style={[styles.tableCol2, styles.tableHeaderText]}>Hours</Text>
                <Text style={[styles.tableCol3, styles.tableHeaderText]}>Amount</Text>
              </View>

              {/* Service Row */}
              <View style={styles.tableRow}>
                <View style={styles.tableCol1}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>
                    {humanize(booking.service_type)}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#6b7280' }}>
                    {humanize(booking.cleaning_type)}
                  </Text>
                </View>
                <Text style={styles.tableCol2}>
                  {booking.total_hours ? `${booking.total_hours}h` : '-'}
                </Text>
                <Text style={styles.tableCol3}>
                  £{booking.total_cost?.toFixed(2) || '0.00'}
                </Text>
              </View>
              
              {/* Total Section */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Due</Text>
                  <Text style={styles.totalValue}>
                    £{booking.total_cost?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bank Details */}
          <View style={styles.bankDetailsSection}>
            <Text style={styles.bankDetailsTitle}>Bank Transfer Details</Text>
            <View style={styles.bankDetailsRow}>
              <Text style={styles.bankDetailsLabel}>Account Name:</Text>
              <Text style={styles.bankDetailsValue}>SN CORE LTD</Text>
            </View>
            <View style={styles.bankDetailsRow}>
              <Text style={styles.bankDetailsLabel}>Sort Code:</Text>
              <Text style={styles.bankDetailsValue}>04-29-09</Text>
            </View>
            <View style={styles.bankDetailsRow}>
              <Text style={styles.bankDetailsLabel}>Account Number:</Text>
              <Text style={styles.bankDetailsValue}>85267368</Text>
            </View>
            <View style={styles.bankDetailsRow}>
              <Text style={styles.bankDetailsLabel}>Reference:</Text>
              <Text style={styles.bankDetailsValue}>{booking.id}</Text>
            </View>
            <Text style={{ fontSize: 8, color: '#1e40af', marginTop: 8, fontStyle: 'italic' }}>
              Please use your booking ID as the payment reference.
            </Text>
          </View>

          {/* Notes */}
          {formattedNotes && (
            <View style={styles.notesSection}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4, color: '#854d0e' }}>
                Additional Notes:
              </Text>
              <Text style={styles.notesText}>{formattedNotes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing SN Cleaning Services!{'\n'}
            For any questions or support, please contact us at info@sncleaningservices.co.uk or +44 203 835 5033
          </Text>
        </View>
      </Page>
    </Document>
  );
};