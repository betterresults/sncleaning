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
    backgroundColor: '#1fa89f',
    padding: 30,
    marginBottom: 0,
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  companyInfo: {
    fontSize: 9,
    color: '#ffffff',
    lineHeight: 1.6,
    opacity: 0.95,
  },
  orderIdBadge: {
    backgroundColor: '#ffffff',
    padding: '8 16',
    borderRadius: 8,
  },
  orderIdText: {
    fontSize: 11,
    color: '#1fa89f',
    fontWeight: 'bold',
  },
  contentWrapper: {
    padding: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a2332',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    border: '1 solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1fa89f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1 solid #f3f4f6',
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
  table: {
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
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '15%',
    textAlign: 'right',
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '15%',
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 20,
    backgroundColor: '#1fa89f',
    padding: 20,
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    backgroundColor: '#1a2332',
    padding: 20,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 1.6,
  },
  badge: {
    padding: '6 12',
    borderRadius: 20,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusScheduled: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusDelivered: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusUnpaid: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    border: '1 solid #e5e7eb',
  },
});

interface LinenOrderPDFProps {
  order: any;
  customer: any;
  address: any;
  items: any[];
}

export const LinenOrderPDF: React.FC<LinenOrderPDFProps> = ({ order, customer, address, items }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return styles.statusDelivered;
      case 'paid': return styles.statusPaid;
      case 'unpaid': return styles.statusUnpaid;
      default: return styles.statusScheduled;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View>
              <Text style={styles.logo}>SN CLEANING SERVICES</Text>
              <Text style={styles.companyInfo}>
                Professional Cleaning & Linen Services{'\n'}
                info@sncleaningservices.co.uk{'\n'}
                +44 203 835 5033
              </Text>
            </View>
            <View style={styles.orderIdBadge}>
              <Text style={styles.orderIdText}>#{order.id.slice(-8).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          {/* Title */}
          <Text style={styles.title}>Linen Order Invoice</Text>

          {/* Order & Customer Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Order Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Order Date:</Text>
                <Text style={styles.value}>{format(new Date(order.order_date), 'dd MMMM yyyy')}</Text>
              </View>
              {order.delivery_date && (
                <View style={styles.row}>
                  <Text style={styles.label}>Delivery Date:</Text>
                  <Text style={styles.value}>{format(new Date(order.delivery_date), 'dd MMMM yyyy')}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Status:</Text>
                <View style={[styles.badge, getStatusColor(order.status)]}>
                  <Text>{order.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Payment:</Text>
                <View style={[styles.badge, getStatusColor(order.payment_status)]}>
                  <Text>{order.payment_status.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>
                  {customer.first_name} {customer.last_name}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{customer.email}</Text>
              </View>
              {customer.phone && (
                <View style={styles.row}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{customer.phone}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.value}>
              {address.address}{'\n'}
              {address.postcode}
            </Text>
          </View>

          {/* Order Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol1, styles.tableHeaderText]}>Product</Text>
                <Text style={[styles.tableCol2, styles.tableHeaderText]}>Qty</Text>
                <Text style={[styles.tableCol3, styles.tableHeaderText]}>Unit Price</Text>
                <Text style={[styles.tableCol4, styles.tableHeaderText]}>Subtotal</Text>
              </View>

              {/* Table Rows */}
              {items.map((item, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={styles.tableCol1}>
                    {item.linen_products.name}
                  </Text>
                  <Text style={styles.tableCol2}>{item.quantity}</Text>
                  <Text style={styles.tableCol3}>£{item.unit_price.toFixed(2)}</Text>
                  <Text style={styles.tableCol4}>£{item.subtotal.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Total Section */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                £{order.total_cost.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {order.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.value}>{order.notes}</Text>
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
