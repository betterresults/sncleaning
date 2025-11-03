import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    width: '60%',
    color: '#000',
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '1 solid #000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e0e0e0',
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
    marginTop: 15,
    paddingTop: 10,
    borderTop: '2 solid #000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    width: 150,
    textAlign: 'right',
    paddingRight: 20,
    fontWeight: 'bold',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: '1 solid #e0e0e0',
    paddingTop: 10,
  },
  badge: {
    padding: '4 8',
    borderRadius: 3,
    fontSize: 8,
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
          <Text style={styles.logo}>SN Cleaning Services</Text>
          <Text style={styles.companyInfo}>
            Professional Cleaning & Linen Services{'\n'}
            Email: info@sncleaningservices.co.uk{'\n'}
            Phone: +44 7592 085 129
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Linen Order Invoice</Text>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID:</Text>
            <Text style={styles.value}>#{order.id.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order Date:</Text>
            <Text style={styles.value}>{format(new Date(order.order_date), 'dd/MM/yyyy')}</Text>
          </View>
          {order.delivery_date && (
            <View style={styles.row}>
              <Text style={styles.label}>Delivery Date:</Text>
              <Text style={styles.value}>{format(new Date(order.delivery_date), 'dd/MM/yyyy')}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, getStatusColor(order.status)]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={[styles.value, getStatusColor(order.payment_status)]}>
              {order.payment_status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
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

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.row}>
            <Text style={styles.value}>
              {address.address}{'\n'}
              {address.postcode}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Product</Text>
            <Text style={styles.tableCol2}>Qty</Text>
            <Text style={styles.tableCol3}>Unit Price</Text>
            <Text style={styles.tableCol4}>Subtotal</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCol1}>
                {item.linen_products.name}
              </Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>£{item.unit_price.toFixed(2)}</Text>
              <Text style={styles.tableCol4}>£{item.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={[styles.totalValue, { fontSize: 14, color: '#16a34a' }]}>
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Thank you for your business!{'\n'}
            For any questions, please contact us at info@sncleaningservices.co.uk
          </Text>
        </View>
      </Page>
    </Document>
  );
};
