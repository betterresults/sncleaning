import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Calendar, MapPin, CreditCard, UserCheck, Clock, Home, Phone, Mail } from 'lucide-react';

interface EditBookingDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingUpdated: () => void;
}

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  hourly_rate: number;
  presentage_rate: number;
}

const EditBookingDialog = ({ booking, open, onOpenChange, onBookingUpdated }: EditBookingDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    postcode: '',
    dateTime: '',
    totalHours: 0,
    totalCost: 0,
    cleanerPay: 0,
    cleanerId: null as number | null,
    cleanerRate: 0,
    cleanerPercentage: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid',
    bookingStatus: 'Confirmed',
    cleaningType: '',
    formName: '',
    additionalDetails: '',
    propertyDetails: '',
    deposit: 0
  });

  // Format datetime for input field
  const formatDateTimeForInput = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  useEffect(() => {
    if (booking && open) {
      console.log('Setting form data for booking:', booking);
      setFormData({
        firstName: booking.first_name || '',
        lastName: booking.last_name || '',
        email: booking.email || '',
        phoneNumber: booking.phone_number || '',
        address: booking.address || '',
        postcode: booking.postcode || '',
        dateTime: formatDateTimeForInput(booking.date_time),
        totalHours: booking.total_hours || 0,
        totalCost: booking.total_cost || 0,
        cleanerPay: booking.cleaner_pay || 0,
        cleanerId: booking.cleaner || null,
        cleanerRate: booking.cleaner_rate || 0,
        cleanerPercentage: booking.cleaner_percentage || 0,
        paymentMethod: booking.payment_method || 'Cash',
        paymentStatus: booking.payment_status || 'Unpaid',
        bookingStatus: booking.booking_status || 'Confirmed',
        cleaningType: booking.cleaning_type || '',
        formName: booking.form_name || '',
        additionalDetails: booking.additional_details || '',
        propertyDetails: booking.property_details || '',
        deposit: booking.deposit || 0
      });
    }
  }, [booking, open]);

  useEffect(() => {
    const fetchCleaners = async () => {
      const { data } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, hourly_rate, presentage_rate')
        .order('first_name');
      
      if (data) {
        setCleaners(data);
      }
    };

    if (open) {
      fetchCleaners();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          address: formData.address,
          postcode: formData.postcode,
          date_time: formData.dateTime,
          total_hours: formData.totalHours,
          total_cost: formData.totalCost,
          cleaner_pay: formData.cleanerPay,
          cleaner: formData.cleanerId,
          cleaner_rate: formData.cleanerRate,
          cleaner_percentage: formData.cleanerPercentage,
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentStatus,
          booking_status: formData.bookingStatus,
          cleaning_type: formData.cleaningType,
          form_name: formData.formName,
          additional_details: formData.additionalDetails,
          property_details: formData.propertyDetails,
          deposit: formData.deposit
        })
        .eq('id', booking.id);

      if (error) {
        console.error('Error updating booking:', error);
        toast({
          title: "Error",
          description: "Failed to update booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Booking updated successfully!",
      });

      onBookingUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'partially paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold text-gray-900">Edit Booking</SheetTitle>
            <div className="flex gap-2">
              <Badge className={getStatusColor(formData.bookingStatus)}>
                {formData.bookingStatus}
              </Badge>
              <Badge className={getPaymentStatusColor(formData.paymentStatus)}>
                {formData.paymentStatus}
              </Badge>
            </div>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-140px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6 py-6">
            <Accordion type="single" collapsible className="space-y-4" defaultValue="">
              
              {/* Customer Details Section */}
              <AccordionItem value="customer" className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 bg-blue-50 hover:bg-blue-100 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-blue-900">Customer Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Booking Details Section */}
              <AccordionItem value="booking" className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 bg-green-50 hover:bg-green-100 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Home className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-green-900">Booking Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="formName" className="text-sm font-medium">Service Type</Label>
                      <Select value={formData.formName} onValueChange={(value) => handleInputChange('formName', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard Cleaning">Standard Cleaning</SelectItem>
                          <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                          <SelectItem value="End of Tenancy">End of Tenancy</SelectItem>
                          <SelectItem value="Office Cleaning">Office Cleaning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cleaningType" className="text-sm font-medium">Property Type</Label>
                      <Select value={formData.cleaningType} onValueChange={(value) => handleInputChange('cleaningType', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Domestic">Domestic</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                          <SelectItem value="Air BnB">Air BnB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postcode" className="text-sm font-medium">Postcode</Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => handleInputChange('postcode', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="propertyDetails" className="text-sm font-medium">Property Details</Label>
                      <Textarea
                        id="propertyDetails"
                        value={formData.propertyDetails}
                        onChange={(e) => handleInputChange('propertyDetails', e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="additionalDetails" className="text-sm font-medium">Additional Details</Label>
                      <Textarea
                        id="additionalDetails"
                        value={formData.additionalDetails}
                        onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Appointment Details Section */}
              <AccordionItem value="appointment" className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 bg-purple-50 hover:bg-purple-100 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-full">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-purple-900">Appointment Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dateTime" className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Date & Time
                      </Label>
                      <Input
                        id="dateTime"
                        type="datetime-local"
                        value={formData.dateTime}
                        onChange={(e) => handleInputChange('dateTime', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalHours" className="text-sm font-medium">Total Hours</Label>
                      <Input
                        id="totalHours"
                        type="number"
                        step="0.5"
                        value={formData.totalHours}
                        onChange={(e) => handleInputChange('totalHours', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bookingStatus" className="text-sm font-medium">Booking Status</Label>
                      <Select value={formData.bookingStatus} onValueChange={(value) => handleInputChange('bookingStatus', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Client Payment Details */}
                  <div className="mt-6 p-4 bg-purple-25 rounded-lg border border-purple-200">
                    <h4 className="text-md font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Client Payment Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="totalCost" className="text-sm font-medium">Total Cost (£)</Label>
                        <Input
                          id="totalCost"
                          type="number"
                          step="0.01"
                          value={formData.totalCost}
                          onChange={(e) => handleInputChange('totalCost', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deposit" className="text-sm font-medium">Deposit (£)</Label>
                        <Input
                          id="deposit"
                          type="number"
                          step="0.01"
                          value={formData.deposit}
                          onChange={(e) => handleInputChange('deposit', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentMethod" className="text-sm font-medium">Payment Type</Label>
                        <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Online">Online</SelectItem>
                            <SelectItem value="Invoiless">Invoiless</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                            <SelectItem value="Stripe">Stripe</SelectItem>
                            <SelectItem value="Direct Debit">Direct Debit</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="paymentStatus" className="text-sm font-medium">Payment Status</Label>
                        <Select value={formData.paymentStatus} onValueChange={(value) => handleInputChange('paymentStatus', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                            <SelectItem value="Refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Cleaner Details Section */}
              <AccordionItem value="cleaner" className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 bg-orange-50 hover:bg-orange-100 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-full">
                      <UserCheck className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-orange-900">Cleaner Assignment</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cleanerId" className="text-sm font-medium">Assigned Cleaner</Label>
                      <Select 
                        value={formData.cleanerId?.toString() || 'none'} 
                        onValueChange={(value) => handleInputChange('cleanerId', value === 'none' ? null : parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select cleaner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No cleaner assigned</SelectItem>
                          {cleaners.map((cleaner) => (
                            <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                              {cleaner.first_name} {cleaner.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Cleaner Payment Details */}
                  <div className="mt-6 p-4 bg-orange-25 rounded-lg border border-orange-200">
                    <h4 className="text-md font-semibold text-orange-800 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Cleaner Payment Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cleanerPay" className="text-sm font-medium">Cleaner Pay (£)</Label>
                        <Input
                          id="cleanerPay"
                          type="number"
                          step="0.01"
                          value={formData.cleanerPay}
                          onChange={(e) => handleInputChange('cleanerPay', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cleanerRate" className="text-sm font-medium">Hourly Rate (£)</Label>
                        <Input
                          id="cleanerRate"
                          type="number"
                          step="0.01"
                          value={formData.cleanerRate}
                          onChange={(e) => handleInputChange('cleanerRate', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cleanerPercentage" className="text-sm font-medium">Percentage (%)</Label>
                        <Input
                          id="cleanerPercentage"
                          type="number"
                          step="1"
                          value={formData.cleanerPercentage}
                          onChange={(e) => handleInputChange('cleanerPercentage', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex justify-end space-x-3 pt-6 border-t bg-gray-50 -mx-6 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Updating...' : 'Update Booking'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EditBookingDialog;
