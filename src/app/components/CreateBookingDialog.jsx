import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { Rating } from "primereact/rating";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { mockHotels, mockUsers } from "../data/mockData";
function CreateBookingDialog({
  visible,
  onHide,
  onBookingCreated
}) {
  const [step, setStep] = useState("location");
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const states = Array.from(new Set(mockHotels.map((h) => h.state))).sort();
  const cities = selectedState ? Array.from(
    new Set(
      mockHotels.filter((h) => h.state === selectedState).map((h) => h.city)
    )
  ).sort() : [];
  const availableHotels = mockHotels.filter(
    (h) => h.state === selectedState && h.city === selectedCity && h.availableRooms > 0
  );
  const resetDialog = () => {
    setStep("location");
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedHotel(null);
    setSelectedUser(null);
    setCheckInDate(null);
    setCheckOutDate(null);
    setSelectedRoomType(null);
    setNumberOfGuests(1);
  };
  const handleHide = () => {
    resetDialog();
    onHide();
  };
  const handleLocationNext = () => {
    if (selectedState && selectedCity) {
      setStep("selectHotel");
    }
  };
  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    setStep("hotelDetails");
  };
  const handleBookNow = () => {
    setStep("bookingDetails");
  };
  const handlePayment = () => {
    if (selectedHotel && selectedUser && checkInDate && checkOutDate && selectedRoomType) {
      setStep("payment");
      setTimeout(() => {
        const days = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1e3 * 60 * 60 * 24)
        );
        const pricePerNight = selectedRoomType === "Standard" ? 150 : selectedRoomType === "Deluxe" ? 250 : 400;
        const totalAmount = days * pricePerNight;
        const newBooking = {
          id: Math.floor(Math.random() * 1e4),
          hotelId: selectedHotel.id,
          hotelName: selectedHotel.name,
          userId: selectedUser.id,
          userName: selectedUser.name,
          checkInDate,
          checkOutDate,
          numberOfGuests,
          roomType: selectedRoomType,
          totalAmount,
          paid: true
        };
        onBookingCreated(newBooking);
        setStep("success");
      }, 1500);
    }
  };
  const calculateTotal = () => {
    if (!checkInDate || !checkOutDate || !selectedRoomType) return 0;
    const days = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1e3 * 60 * 60 * 24)
    );
    const pricePerNight = selectedRoomType === "Standard" ? 150 : selectedRoomType === "Deluxe" ? 250 : 400;
    return days * pricePerNight;
  };
  const getDialogHeader = () => {
    switch (step) {
      case "location":
        return "Select Location";
      case "selectHotel":
        return "Available Hotels";
      case "hotelDetails":
        return "Hotel Details";
      case "bookingDetails":
        return "Booking Details";
      case "payment":
        return "Processing Payment";
      case "success":
        return "Booking Confirmed";
      default:
        return "Create Booking";
    }
  };
  return <Dialog
    visible={visible}
    onHide={handleHide}
    header={getDialogHeader()}
    style={{ width: "90vw", maxWidth: "900px" }}
    modal
    dismissableMask={step !== "payment"}
    closable={step !== "payment"}
  >
      {step === "location" && <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="state">State</label>
            <Dropdown
    id="state"
    value={selectedState}
    onChange={(e) => {
      setSelectedState(e.value);
      setSelectedCity(null);
    }}
    options={states.map((s) => ({ label: s, value: s }))}
    placeholder="Select a state"
    className="w-full"
  />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="city">City</label>
            <Dropdown
    id="city"
    value={selectedCity}
    onChange={(e) => setSelectedCity(e.value)}
    options={cities.map((c) => ({ label: c, value: c }))}
    placeholder="Select a city"
    className="w-full"
    disabled={!selectedState}
  />
          </div>
          <Button
    label="Find Hotels"
    icon="pi pi-search"
    onClick={handleLocationNext}
    disabled={!selectedState || !selectedCity}
    className="mt-4"
  />
        </div>}

      {step === "selectHotel" && <div className="flex flex-col gap-4 p-4">
          {availableHotels.length === 0 ? <div className="text-center p-4">
              <i className="pi pi-info-circle text-4xl text-gray-400 mb-3" />
              <p>No hotels available in this location.</p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableHotels.map((hotel) => <Card
    key={hotel.id}
    className="cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => handleHotelSelect(hotel)}
  >
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <h3 className="m-0">{hotel.name}</h3>
                      <Tag
    value={`${hotel.availableRooms} available`}
    severity="success"
  />
                    </div>
                    <Rating value={hotel.rating} readOnly cancel={false} />
                    <p className="text-sm text-gray-600 m-0">
                      {hotel.city}, {hotel.state}
                    </p>
                    <p className="text-sm m-0">
                      <i className="pi pi-phone mr-2" />
                      {hotel.phoneNumber}
                    </p>
                  </div>
                </Card>)}
            </div>}
          <Button
    label="Back"
    icon="pi pi-arrow-left"
    onClick={() => setStep("location")}
    className="p-button-outlined mt-4"
  />
        </div>}

      {step === "hotelDetails" && selectedHotel && <div className="flex flex-col gap-4 p-4">
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="mt-0">{selectedHotel.name}</h2>
                  <p className="text-gray-600 m-0">
                    {selectedHotel.city}, {selectedHotel.state}
                  </p>
                </div>
                <Rating value={selectedHotel.rating} readOnly cancel={false} />
              </div>
              <Divider />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-2">Contact</p>
                  <p className="text-sm">
                    <i className="pi pi-phone mr-2" />
                    {selectedHotel.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Availability</p>
                  <Tag
    value={`${selectedHotel.availableRooms} rooms available`}
    severity="success"
  />
                </div>
                <div>
                  <p className="font-semibold mb-2">Total Bookings</p>
                  <p className="text-sm">{selectedHotel.totalBooked} bookings</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Room Types</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedHotel.roomTypes.map((type, index) => <Tag key={index} value={type} />)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <div className="flex gap-3">
            <Button
    label="Back"
    icon="pi pi-arrow-left"
    onClick={() => setStep("selectHotel")}
    className="p-button-outlined flex-1"
  />
            <Button
    label="Book Now"
    icon="pi pi-calendar"
    onClick={handleBookNow}
    className="flex-1"
  />
          </div>
        </div>}

      {step === "bookingDetails" && selectedHotel && <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="user">Select Guest</label>
            <Dropdown
    id="user"
    value={selectedUser}
    onChange={(e) => setSelectedUser(e.value)}
    options={mockUsers}
    optionLabel="name"
    placeholder="Select a guest"
    className="w-full"
    filter
  />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="checkIn">Check-In Date</label>
              <Calendar
    id="checkIn"
    value={checkInDate}
    onChange={(e) => setCheckInDate(e.value)}
    minDate={/* @__PURE__ */ new Date()}
    placeholder="Select check-in date"
    className="w-full"
    showIcon
  />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="checkOut">Check-Out Date</label>
              <Calendar
    id="checkOut"
    value={checkOutDate}
    onChange={(e) => setCheckOutDate(e.value)}
    minDate={checkInDate || /* @__PURE__ */ new Date()}
    placeholder="Select check-out date"
    className="w-full"
    showIcon
    disabled={!checkInDate}
  />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="roomType">Room Type</label>
              <Dropdown
    id="roomType"
    value={selectedRoomType}
    onChange={(e) => setSelectedRoomType(e.value)}
    options={selectedHotel.roomTypes.map((type) => ({
      label: type,
      value: type
    }))}
    placeholder="Select room type"
    className="w-full"
  />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="guests">Number of Guests</label>
              <InputNumber
    id="guests"
    value={numberOfGuests}
    onValueChange={(e) => setNumberOfGuests(e.value || 1)}
    min={1}
    max={10}
    className="w-full"
  />
            </div>
          </div>
          {checkInDate && checkOutDate && selectedRoomType && <Card className="bg-blue-50">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>
            </Card>}
          <div className="flex gap-3">
            <Button
    label="Back"
    icon="pi pi-arrow-left"
    onClick={() => setStep("hotelDetails")}
    className="p-button-outlined flex-1"
  />
            <Button
    label="Proceed to Payment"
    icon="pi pi-credit-card"
    onClick={handlePayment}
    disabled={!selectedUser || !checkInDate || !checkOutDate || !selectedRoomType}
    className="flex-1"
  />
          </div>
        </div>}

      {step === "payment" && <div className="flex flex-col items-center justify-center gap-4 p-8">
          <i className="pi pi-spin pi-spinner text-6xl text-blue-600" />
          <p className="text-xl">Processing your payment...</p>
          <p className="text-gray-600">Please wait</p>
        </div>}

      {step === "success" && <div className="flex flex-col items-center justify-center gap-4 p-8">
          <i className="pi pi-check-circle text-6xl text-green-600" />
          <h3 className="text-2xl m-0">Payment Successful!</h3>
          <p className="text-xl text-gray-600">Booking Confirmed</p>
          <Card className="w-full mt-4">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Hotel:</span>
                <span className="font-semibold">{selectedHotel?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guest:</span>
                <span className="font-semibold">{selectedUser?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-In:</span>
                <span className="font-semibold">
                  {checkInDate?.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-Out:</span>
                <span className="font-semibold">
                  {checkOutDate?.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room Type:</span>
                <span className="font-semibold">{selectedRoomType}</span>
              </div>
              <Divider />
              <div className="flex justify-between">
                <span className="text-xl font-semibold">Total Paid:</span>
                <span className="text-xl font-bold text-green-600">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
          <Button
    label="Close"
    icon="pi pi-times"
    onClick={handleHide}
    className="mt-4 w-full"
  />
        </div>}
    </Dialog>;
}
export {
  CreateBookingDialog
};
