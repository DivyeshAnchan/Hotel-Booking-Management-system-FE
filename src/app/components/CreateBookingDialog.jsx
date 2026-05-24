import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { Rating } from "primereact/rating";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const hotelRatingOptions = [
  { label: "All Ratings", value: null },
  { label: "4+ Stars", value: 4 },
  { label: "4.5+ Stars", value: 4.5 }
];

const hotelStatusOptions = [
  { label: "Active Hotels", value: "active" },
  { label: "All Status", value: null },
  { label: "Inactive Hotels", value: "inactive" }
];

const hotelPriceOptions = [
  { label: "All Prices", value: null },
  { label: "Under ₹3,000", value: "0-3000" },
  { label: "₹3,000 - ₹5,000", value: "3000-5000" },
  { label: "₹5,000 - ₹8,000", value: "5000-8000" },
  { label: "₹8,000+", value: "8000-" }
];

const hotelSortOptions = [
  { label: "Most Available", value: "availableRooms:desc" },
  { label: "Highest Rated", value: "rating:desc" },
  { label: "Most Booked", value: "totalBooked:desc" },
  { label: "Name A-Z", value: "name:asc" }
];

function mapUserFromApi(user) {
  return {
    id: user._id || user.id,
    name: user.name || "",
    email: user.email || "",
    phoneNumber: user.phone || user.phoneNumber || ""
  };
}

function mapHotelFromApi(hotel) {
  const roomTypes = Array.isArray(hotel.roomTypes) && hotel.roomTypes.length > 0
    ? hotel.roomTypes.map((roomType) => {
      if (typeof roomType === "string") {
        return {
          type: roomType,
          pricePerNight: hotel.pricePerNight ?? 0,
          capacity: null
        };
      }

      return {
        type: roomType.type || "standard",
        pricePerNight: roomType.pricePerNight ?? hotel.pricePerNight ?? 0,
        capacity: roomType.capacity ?? null
      };
    })
    : [
      {
        type: "standard",
        pricePerNight: hotel.pricePerNight ?? 0,
        capacity: null
      }
    ];

  return {
    id: hotel._id || hotel.id,
    name: hotel.name || "",
    location: hotel.location || "",
    phoneNumber: hotel.phone || hotel.phoneNumber || "",
    country: hotel.country || "",
    amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
    state: hotel.state || "",
    city: hotel.city || "",
    rating: hotel.rating ?? 0,
    totalBooked: hotel.totalBooked ?? 0,
    availableRooms: hotel.availableRooms ?? 0,
    pricePerNight: hotel.pricePerNight ?? roomTypes[0]?.pricePerNight ?? 0,
    roomTypes,
    isActive: hotel.isActive ?? true
  };
}

function toSelectOptions(values) {
  return Array.isArray(values)
    ? values.filter(Boolean).map((value) => ({ label: value, value }))
    : [];
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatRoomType(roomType) {
  return roomType
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatHotelAddress(hotel) {
  return [hotel.location, hotel.city, hotel.state, hotel.country]
    .filter(Boolean)
    .join(", ");
}

function getHotelMinimumPrice(hotel) {
  const roomPrices = Array.isArray(hotel.roomTypes)
    ? hotel.roomTypes.map((roomType) => Number(roomType.pricePerNight || 0))
    : [];
  const validRoomPrices = roomPrices.filter((price) => price > 0);

  if (validRoomPrices.length > 0) {
    return Math.min(...validRoomPrices);
  }

  return Number(hotel.pricePerNight || 0);
}

function isValueSelected(value) {
  return value !== null && value !== undefined && value !== "";
}

function isHotelInPriceRange(hotel, priceRange) {
  if (!priceRange) return true;

  const [minimumPrice, maximumPrice] = priceRange
    .split("-")
    .map((value) => (value === "" ? null : Number(value)));
  const hotelPrice = getHotelMinimumPrice(hotel);

  if (minimumPrice !== null && hotelPrice < minimumPrice) return false;
  if (maximumPrice !== null && hotelPrice > maximumPrice) return false;

  return true;
}

function getSortParams(sortValue) {
  const [sortBy = "availableRooms", sortOrder = "desc"] = String(sortValue || "")
    .split(":");

  return {
    sortBy,
    sortOrder
  };
}

function getStayNights(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) return 0;

  return Math.max(
    1,
    Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1e3 * 60 * 60 * 24)
    )
  );
}

function getRequiredRoomCount(numberOfGuests, roomType) {
  const capacity = Number(roomType?.capacity || 0);

  if (capacity <= 0) return 1;

  return Math.max(1, Math.ceil(numberOfGuests / capacity));
}

function toApiDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatReceiptDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function normalizeRoomTypeForApi(roomType) {
  return String(roomType?.type || roomType || "").trim().toLowerCase();
}

function formatBookingStatus(status) {
  if (!status) return "Pending";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function copyTextToClipboard(text) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard is not available in this browser.");
  }

  await navigator.clipboard.writeText(text);
}

function CreateBookingDialog({
  visible,
  onHide,
  onBookingCreated
}) {
  const hotelSummaryListRef = useRef(null);
  const copyResetTimeoutRef = useRef(null);
  const [step, setStep] = useState("location");
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [validationError, setValidationError] = useState("");
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState("");
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState("");
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsError, setHotelsError] = useState("");
  const [hotelPage, setHotelPage] = useState(1);
  const [hotelSearch, setHotelSearch] = useState("");
  const [debouncedHotelSearch, setDebouncedHotelSearch] = useState("");
  const [hotelRatingFilter, setHotelRatingFilter] = useState(null);
  const [hotelStatusFilter, setHotelStatusFilter] = useState("active");
  const [hotelPriceFilter, setHotelPriceFilter] = useState(null);
  const [hotelSort, setHotelSort] = useState("availableRooms:desc");
  const [bookingCreateError, setBookingCreateError] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [bookingConfirming, setBookingConfirming] = useState(false);
  const [bookingConfirmError, setBookingConfirmError] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingIdCopied, setBookingIdCopied] = useState(false);
  const [hotelPagination, setHotelPagination] = useState({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  useEffect(() => {
    if (!visible) return;

    const controller = new AbortController();

    async function loadUsers() {
      setUsersLoading(true);
      setUsersError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/users?page=1&limit=100&sortBy=name&sortOrder=asc`,
          { signal: controller.signal }
        );
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch guests");
        }

        setUsers(Array.isArray(json.data) ? json.data.map(mapUserFromApi) : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        setUsers([]);
        setUsersError(err.message || "Failed to fetch guests");
      } finally {
        if (!controller.signal.aborted) {
          setUsersLoading(false);
        }
      }
    }

    loadUsers();

    return () => controller.abort();
  }, [visible]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const controller = new AbortController();

    async function loadStates() {
      setStatesLoading(true);
      setStatesError("");

      try {
        const response = await fetch(`${API_BASE_URL}/hotels/states`, {
          signal: controller.signal
        });
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch states");
        }

        setStates(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        setStates([]);
        setStatesError(err.message || "Failed to fetch states");
      } finally {
        if (!controller.signal.aborted) {
          setStatesLoading(false);
        }
      }
    }

    loadStates();

    return () => controller.abort();
  }, [visible]);

  useEffect(() => {
    if (!visible || !selectedState) {
      setCities([]);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ state: selectedState });

    async function loadCities() {
      setCitiesLoading(true);
      setCitiesError("");

      try {
        const response = await fetch(`${API_BASE_URL}/hotels/cities?${params}`, {
          signal: controller.signal
        });
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch cities");
        }

        setCities(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        setCities([]);
        setCitiesError(err.message || "Failed to fetch cities");
      } finally {
        if (!controller.signal.aborted) {
          setCitiesLoading(false);
        }
      }
    }

    loadCities();

    return () => controller.abort();
  }, [selectedState, visible]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedHotelSearch(hotelSearch.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [hotelSearch]);

  useEffect(() => {
    if (step !== "selectHotel" || hotelsLoading) return;

    window.requestAnimationFrame(() => {
      hotelSummaryListRef.current?.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }, [hotelPage, hotelsLoading, step]);

  useEffect(() => {
    if (!visible || step !== "selectHotel" || !selectedState || !selectedCity) return;

    fetchHotels(1);
  }, [
    debouncedHotelSearch,
    hotelRatingFilter,
    hotelSort,
    hotelStatusFilter,
    selectedCity,
    selectedState,
    step,
    visible
  ]);

  const fetchHotels = async (page = 1) => {
    if (!selectedState || !selectedCity) return;

    setHotelsLoading(true);
    setHotelsError("");
    const { sortBy, sortOrder } = getSortParams(hotelSort);

    const params = new URLSearchParams({
      state: selectedState,
      city: selectedCity,
      page: String(page),
      limit: "10",
      sortBy,
      sortOrder
    });

    if (debouncedHotelSearch) params.set("search", debouncedHotelSearch);
    if (isValueSelected(hotelRatingFilter)) {
      params.set("rating", String(hotelRatingFilter));
    }
    if (isValueSelected(hotelStatusFilter)) {
      params.set("status", hotelStatusFilter);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/hotels?${params}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch hotels");
      }

      setHotels(Array.isArray(json.data) ? json.data.map(mapHotelFromApi) : []);
      setHotelPagination({
        totalItems: json.pagination?.totalItems ?? 0,
        currentPage: json.pagination?.currentPage ?? page,
        totalPages: json.pagination?.totalPages ?? 1,
        limit: json.pagination?.limit ?? 10,
        hasNextPage: Boolean(json.pagination?.hasNextPage),
        hasPreviousPage: Boolean(json.pagination?.hasPreviousPage)
      });
      setHotelPage(json.pagination?.currentPage ?? page);
    } catch (err) {
      setHotels([]);
      setHotelPagination({
        totalItems: 0,
        currentPage: page,
        totalPages: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false
      });
      setHotelsError(err.message || "Failed to fetch hotels");
    } finally {
      setHotelsLoading(false);
    }
  };

  const stateOptions = toSelectOptions(states);
  const cityOptions = toSelectOptions(cities);
  const visibleHotels = hotels.filter((hotel) => isHotelInPriceRange(hotel, hotelPriceFilter));
  const hasActiveHotelFilters =
    Boolean(hotelSearch.trim()) ||
    isValueSelected(hotelRatingFilter) ||
    isValueSelected(hotelPriceFilter) ||
    hotelSort !== "availableRooms:desc";
  const resetHotelFilters = () => {
    setHotelSearch("");
    setDebouncedHotelSearch("");
    setHotelRatingFilter(null);
    setHotelStatusFilter("active");
    setHotelPriceFilter(null);
    setHotelSort("availableRooms:desc");
  };
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
    setValidationError("");
    setLocationSearchLoading(false);
    setBookingCreateError("");
    setBookingSubmitting(false);
    setCreatedBooking(null);
    setBookingConfirming(false);
    setBookingConfirmError("");
    setBookingConfirmed(false);
    setBookingIdCopied(false);
    if (copyResetTimeoutRef.current) {
      window.clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = null;
    }
    setCities([]);
    setHotels([]);
    setHotelsError("");
    setHotelPage(1);
    resetHotelFilters();
    setHotelPagination({
      totalItems: 0,
      currentPage: 1,
      totalPages: 1,
      limit: 10,
      hasNextPage: false,
      hasPreviousPage: false
    });
  };
  const handleHide = () => {
    resetDialog();
    onHide();
  };
  const handleLocationNext = async () => {
    if (!selectedState && !selectedCity) {
      setValidationError("Please select a state and city");
      return;
    }
    if (!selectedState) {
      setValidationError("Please select a state");
      return;
    }
    if (!selectedCity) {
      setValidationError("Please select a city");
      return;
    }

    setValidationError("");
    setSelectedHotel(null);
    setSelectedRoomType(null);
    setHotelPage(1);
    setLocationSearchLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    setStep("selectHotel");
    setLocationSearchLoading(false);
  };
  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    setStep("hotelDetails");
  };
  const handleBookNow = () => {
    setBookingCreateError("");
    setStep("bookingDetails");
  };
  const handlePayment = async () => {
    if (!selectedHotel || !selectedUser || !checkInDate || !checkOutDate || !selectedRoomType) {
      return;
    }

    const totalAmount = calculateTotal();

    if (totalAmount <= 0) {
      setBookingCreateError("Total amount must be greater than zero.");
      return;
    }

    setBookingCreateError("");
    setBookingConfirmError("");
    setBookingConfirmed(false);
    setBookingIdCopied(false);
    setBookingSubmitting(true);
    setStep("payment");

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          hotelId: selectedHotel.id,
          checkInDate: toApiDate(checkInDate),
          checkOutDate: toApiDate(checkOutDate),
          roomType: normalizeRoomTypeForApi(selectedRoomType),
          numberOfGuests,
          totalAmount
        })
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to create booking");
      }

      setCreatedBooking(json.data);
      onBookingCreated(json.data);
      setStep("success");
    } catch (err) {
      setBookingCreateError(err.message || "Failed to create booking");
      setStep("bookingDetails");
    } finally {
      setBookingSubmitting(false);
    }
  };
  const handleCopyBookingId = async () => {
    const bookingId = createdBooking?.bookingNumber || createdBooking?._id;

    if (!bookingId) return;

    try {
      await copyTextToClipboard(bookingId);
      setBookingIdCopied(true);

      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setBookingIdCopied(false);
      }, 1800);
    } catch (err) {
      setBookingConfirmError(err.message || "Could not copy booking id.");
    }
  };
  const handleConfirmBooking = async () => {
    if (!createdBooking?._id) {
      setBookingConfirmError("Booking id is missing. Please close and refresh bookings.");
      return;
    }

    setBookingConfirmError("");
    setBookingConfirming(true);
    const minimumLoadingTime = new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${createdBooking._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "confirmed"
        })
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to confirm booking");
      }

      await minimumLoadingTime;

      const confirmedBooking = {
        ...createdBooking,
        status: "confirmed"
      };

      setCreatedBooking(confirmedBooking);
      setBookingConfirmed(true);
      onBookingCreated(confirmedBooking);
    } catch (err) {
      await minimumLoadingTime;
      setBookingConfirmError(err.message || "Failed to confirm booking");
    } finally {
      setBookingConfirming(false);
    }
  };
  const calculateTotal = () => {
    if (!checkInDate || !checkOutDate || !selectedRoomType) return 0;
    const days = getStayNights(checkInDate, checkOutDate);
    const requiredRooms = getRequiredRoomCount(numberOfGuests, selectedRoomType);
    const pricePerNight = selectedRoomType.pricePerNight || selectedHotel?.pricePerNight || 0;
    return days * requiredRooms * pricePerNight;
  };

  const userValueTemplate = (option, props) => {
    if (!option) {
      return <span className="booking-control-placeholder">{props.placeholder}</span>;
    }

    return <span className="booking-control-value">{option.name}</span>;
  };

  const userItemTemplate = (option) => {
    return (
      <div className="booking-dropdown-option">
        <span>{option.name}</span>
        {option.phoneNumber && <small>{option.phoneNumber}</small>}
      </div>
    );
  };

  const roomTypeValueTemplate = (option, props) => {
    if (!option) {
      return <span className="booking-control-placeholder">{props.placeholder}</span>;
    }

    const roomType = option.value || option;

    return (
      <span className="booking-control-value">
        {formatRoomType(roomType.type)} · {formatCurrency(roomType.pricePerNight)}
        {roomType.capacity ? ` · ${roomType.capacity} guests` : ""}
      </span>
    );
  };

  const roomTypeItemTemplate = (option) => {
    const roomType = option.value || option;

    return (
      <div className="booking-dropdown-option">
        <span>{formatRoomType(roomType.type)}</span>
        <small>
          {formatCurrency(roomType.pricePerNight)} / night
          {roomType.capacity ? ` · ${roomType.capacity} guests max` : ""}
        </small>
      </div>
    );
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
        return "Creating Booking";
      case "success":
        return "Booking Receipt";
      default:
        return "Create Booking";
    }
  };

  const dialogStyle = step === "location"
    ? { width: "min(92vw, 640px)" }
    : { width: "90vw", maxWidth: "900px" };
  const receiptBookingId = createdBooking?.bookingNumber || createdBooking?._id;
  const receiptConfirmed = bookingConfirmed || createdBooking?.status === "confirmed";

  return <Dialog
    visible={visible}
    onHide={handleHide}
    header={getDialogHeader()}
    style={dialogStyle}
    modal
    dismissableMask={step !== "payment"}
    closable={step !== "payment"}
  >
      {step === "location" && <div className="booking-dialog-panel booking-location-panel">
          <div>
            <p className="booking-step-eyebrow">Destination</p>
            <h3 className="booking-step-title">Choose where the guest wants to stay</h3>
          </div>
          <div className="booking-location-grid">
            <div className="booking-location-field">
              <label htmlFor="state" className="font-semibold text-slate-900">State</label>
              <Dropdown
    id="state"
    value={selectedState}
    onChange={(e) => {
      setSelectedState(e.value);
      setSelectedCity(null);
      setCities([]);
      setHotels([]);
      resetHotelFilters();
      setCitiesError("");
      setValidationError("");
    }}
    options={stateOptions}
    optionLabel="label"
    optionValue="value"
    placeholder={statesLoading ? "Loading states..." : "Search or choose a state"}
    showClear
    filter
    emptyFilterMessage="No states found"
    emptyMessage={statesLoading ? "Loading states..." : "No states available"}
    className="booking-location-dropdown"
    disabled={statesLoading}
    panelClassName="dialog-dropdown-panel"
  />
            </div>
            <div className="booking-location-field">
              <label htmlFor="city" className="font-semibold text-slate-900">City</label>
              <Dropdown
    id="city"
    value={selectedCity}
    onChange={(e) => {
      setSelectedCity(e.value);
      setHotels([]);
      resetHotelFilters();
      setValidationError("");
    }}
    options={cityOptions}
    optionLabel="label"
    optionValue="value"
    placeholder={citiesLoading ? "Loading cities..." : "Search or choose a city"}
    showClear
    filter
    emptyFilterMessage="No cities found"
    emptyMessage={selectedState ? "No cities available" : "Select a state first"}
    className="booking-location-dropdown"
    disabled={!selectedState || citiesLoading}
    panelClassName="dialog-dropdown-panel"
  />
            </div>
          </div>
          {statesError && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <i className="pi pi-exclamation-circle text-red-600" />
            <p className="m-0 text-sm text-red-600 font-medium">{statesError}</p>
          </div>}
          {citiesError && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <i className="pi pi-exclamation-circle text-red-600" />
            <p className="m-0 text-sm text-red-600 font-medium">{citiesError}</p>
          </div>}
          {validationError && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <i className="pi pi-exclamation-circle text-red-600" />
            <p className="m-0 text-sm text-red-600 font-medium">{validationError}</p>
          </div>}
          <Button
    label={locationSearchLoading ? "Searching Hotels" : "Find Hotels"}
    icon={locationSearchLoading ? "pi pi-spin pi-spinner" : "pi pi-search"}
    onClick={handleLocationNext}
    disabled={locationSearchLoading}
    className="dialog-primary-button booking-find-button"
    size="large"
  />
        </div>}

      {step === "selectHotel" && <div className="booking-dialog-panel hotel-results-panel">
          <div className="hotel-results-header">
            <div>
      <p className="booking-step-eyebrow">Hotels in {selectedCity}</p>
              <h3 className="booking-step-title">
                {hotelsLoading
                  ? "Searching hotels..."
                  : `${hotelPagination.totalItems} matching hotels${hotelPriceFilter ? ` · ${visibleHotels.length} in price range on this page` : ""}`}
              </h3>
            </div>
            <Tag value={`${selectedState}, ${selectedCity}`} icon="pi pi-map-marker" />
          </div>

          <div className="hotel-results-filters" aria-label="Hotel result filters">
            <span className="hotel-results-search">
              <i className="pi pi-search" />
              <InputText
    type="search"
    value={hotelSearch}
    onChange={(event) => setHotelSearch(event.target.value)}
    placeholder="Search hotel name"
    className="hotel-results-search-input"
  />
            </span>
            <Dropdown
    value={hotelRatingFilter}
    onChange={(event) => setHotelRatingFilter(event.value)}
    options={hotelRatingOptions}
    optionLabel="label"
    optionValue="value"
    placeholder="Rating"
    className="hotel-results-filter"
  />
            <Dropdown
    value={hotelPriceFilter}
    onChange={(event) => setHotelPriceFilter(event.value)}
    options={hotelPriceOptions}
    optionLabel="label"
    optionValue="value"
    placeholder="Price"
    className="hotel-results-filter"
  />
            <Dropdown
    value={hotelSort}
    onChange={(event) => setHotelSort(event.value)}
    options={hotelSortOptions}
    optionLabel="label"
    optionValue="value"
    placeholder="Sort"
    className="hotel-results-filter hotel-results-sort"
  />
            {hasActiveHotelFilters && (
              <Button
    label="Clear"
    icon="pi pi-filter-slash"
    onClick={resetHotelFilters}
    className="dialog-secondary-button hotel-results-clear-button p-button-outlined"
  />
            )}
          </div>

          {hotelsError && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <i className="pi pi-exclamation-circle text-red-600" />
            <p className="m-0 text-sm text-red-600 font-medium">{hotelsError}</p>
          </div>}

          {hotelsLoading ? <div className="hotel-results-loading">
              <i className="pi pi-spin pi-spinner" />
              <span>Finding hotels...</span>
            </div> : visibleHotels.length === 0 ? <div className="hotel-results-empty">
              <i className="pi pi-info-circle text-5xl text-slate-300 mb-3 block" />
              <p>No hotels match these filters.</p>
              {hasActiveHotelFilters && (
                <Button
    label="Clear Filters"
    icon="pi pi-filter-slash"
    onClick={resetHotelFilters}
    className="dialog-secondary-button p-button-outlined"
  />
              )}
            </div> : <div className="hotel-summary-list" ref={hotelSummaryListRef}>
              {visibleHotels.map((hotel) => {
                const minimumRoomPrice = getHotelMinimumPrice(hotel);
                const visibleAmenities = hotel.amenities.slice(0, 3);

                return <button
    type="button"
    key={hotel.id}
    className="hotel-summary-card"
    onClick={() => handleHotelSelect(hotel)}
  >
                  <div className="hotel-summary-main">
                    <div className="hotel-summary-title-row">
                      <h3>{hotel.name}</h3>
                      <Tag value={`${hotel.availableRooms} rooms`} icon="pi pi-home" />
                    </div>
                    <div className="hotel-summary-meta">
                      <Rating value={hotel.rating} readOnly cancel={false} />
                      <span>{hotel.rating.toFixed(1)}</span>
                      <span>•</span>
                      <span>{hotel.location || hotel.city}</span>
                      <span>•</span>
                      <span>{hotel.phoneNumber}</span>
                    </div>
                    <div className="hotel-summary-tags">
                      {hotel.roomTypes.slice(0, 3).map((roomType) => (
                        <span key={roomType.type}>
                          {formatRoomType(roomType.type)}
                          {roomType.capacity ? ` · ${roomType.capacity} guests` : ""}
                        </span>
                      ))}
                      {visibleAmenities.map((amenity) => (
                        <span key={amenity}>{amenity}</span>
                      ))}
                    </div>
                  </div>
                  <div className="hotel-summary-side">
                    <span className="hotel-summary-price">
                      {formatCurrency(minimumRoomPrice)}
                    </span>
                    <span className="hotel-summary-price-note">lowest room/night</span>
                    <span className="hotel-summary-booked">{hotel.totalBooked} bookings</span>
                  </div>
                </button>;
              })}
            </div>}

          <div className="hotel-results-footer">
            <Button
    label="Back"
    icon="pi pi-arrow-left"
    onClick={() => setStep("location")}
    className="dialog-secondary-button"
  />
            <div className="hotel-results-pagination">
              <Button
    icon="pi pi-chevron-left"
    aria-label="Previous hotels page"
    disabled={hotelsLoading || !hotelPagination.hasPreviousPage}
    onClick={() => fetchHotels(Math.max(1, hotelPage - 1))}
    className="dialog-secondary-button hotel-page-button"
  />
              <span>Page {hotelPagination.currentPage} of {hotelPagination.totalPages}</span>
              <Button
    icon="pi pi-chevron-right"
    aria-label="Next hotels page"
    disabled={hotelsLoading || !hotelPagination.hasNextPage}
    onClick={() => fetchHotels(hotelPage + 1)}
    className="dialog-secondary-button hotel-page-button"
  />
            </div>
          </div>
        </div>}

      {step === "hotelDetails" && selectedHotel && <div className="hotel-detail-panel">
          <Card className="hotel-detail-card">
            <div className="hotel-detail-hero">
              <div className="hotel-detail-title">
                <h2>{selectedHotel.name}</h2>
                <p>
                  <i className="pi pi-map-marker" />
                  {formatHotelAddress(selectedHotel) || `${selectedHotel.city}, ${selectedHotel.state}`}
                </p>
              </div>
              <div className="hotel-detail-rating">
                <Rating value={selectedHotel.rating} readOnly cancel={false} />
                <span>{selectedHotel.rating.toFixed(1)} rating</span>
              </div>
            </div>

            <div className="hotel-detail-metrics">
              <div className="hotel-detail-metric">
                <span className="hotel-detail-metric-icon"><i className="pi pi-phone" /></span>
                <div>
                  <p>Contact</p>
                  <strong>{selectedHotel.phoneNumber || "Not available"}</strong>
                </div>
              </div>
              <div className="hotel-detail-metric">
                <span className="hotel-detail-metric-icon"><i className="pi pi-home" /></span>
                <div>
                  <p>Availability</p>
                  <strong>{selectedHotel.availableRooms} rooms available</strong>
                </div>
              </div>
              <div className="hotel-detail-metric">
                <span className="hotel-detail-metric-icon"><i className="pi pi-calendar-check" /></span>
                <div>
                  <p>Total Bookings</p>
                  <strong>{selectedHotel.totalBooked} bookings</strong>
                </div>
              </div>
              <div className="hotel-detail-metric">
                <span className="hotel-detail-metric-icon"><i className="pi pi-check-circle" /></span>
                <div>
                  <p>Status</p>
                  <strong>{selectedHotel.isActive ? "Active hotel" : "Inactive hotel"}</strong>
                </div>
              </div>
            </div>

            <Divider />

            <div className="hotel-detail-section">
              <div>
                <h3>Amenities</h3>
                <p>Facilities available for this property.</p>
              </div>
              {selectedHotel.amenities.length > 0 ? (
                <div className="hotel-detail-chip-list">
                  {selectedHotel.amenities.map((amenity) => (
                    <span key={amenity}>
                      <i className="pi pi-check" />
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="hotel-detail-empty">No amenities listed for this hotel.</p>
              )}
            </div>

            <Divider />

            <div className="hotel-detail-section">
              <div>
                <h3>Room Types</h3>
                <p>Available room categories, guest capacity, and nightly rates.</p>
              </div>
              <div className="hotel-room-grid">
                {selectedHotel.roomTypes.map((roomType) => (
                  <div className="hotel-room-card" key={roomType.type}>
                    <div>
                      <h4>{formatRoomType(roomType.type)}</h4>
                      <p>{roomType.capacity ? `${roomType.capacity} guests capacity` : "Capacity not specified"}</p>
                    </div>
                    <strong>{formatCurrency(roomType.pricePerNight)}</strong>
                  </div>
                ))}
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
    options={users}
    optionLabel="name"
    valueTemplate={userValueTemplate}
    itemTemplate={userItemTemplate}
    placeholder={usersLoading ? "Loading guests..." : "Select a guest"}
    className="w-full"
    filter
    disabled={usersLoading}
  />
            {usersError && <p className="m-0 text-sm text-red-600 font-medium">{usersError}</p>}
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
    options={selectedHotel.roomTypes.map((roomType) => ({
      label: `${formatRoomType(roomType.type)} · ${formatCurrency(roomType.pricePerNight)} / night${roomType.capacity ? ` · ${roomType.capacity} guests` : ""}`,
      value: roomType
    }))}
    optionLabel="label"
    valueTemplate={roomTypeValueTemplate}
    itemTemplate={roomTypeItemTemplate}
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
              <div className="booking-total-card">
                <div>
                  <span className="font-semibold">Total Amount:</span>
                  <p>
                    {getStayNights(checkInDate, checkOutDate)} night{getStayNights(checkInDate, checkOutDate) === 1 ? "" : "s"} ·{" "}
                    {getRequiredRoomCount(numberOfGuests, selectedRoomType)} room{getRequiredRoomCount(numberOfGuests, selectedRoomType) === 1 ? "" : "s"} ·{" "}
                    {formatCurrency(selectedRoomType.pricePerNight)} / night
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </Card>}
          {bookingCreateError && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <i className="pi pi-exclamation-circle text-red-600" />
            <p className="m-0 text-sm text-red-600 font-medium">{bookingCreateError}</p>
          </div>}
          <div className="flex gap-3">
            <Button
    label="Back"
    icon="pi pi-arrow-left"
    onClick={() => setStep("hotelDetails")}
    className="p-button-outlined flex-1"
  />
            <Button
    label={bookingSubmitting ? "Creating Booking" : "Proceed to Payment"}
    icon={bookingSubmitting ? "pi pi-spin pi-spinner" : "pi pi-credit-card"}
    onClick={handlePayment}
    disabled={bookingSubmitting || !selectedUser || !checkInDate || !checkOutDate || !selectedRoomType}
    className="flex-1"
  />
          </div>
        </div>}

      {step === "payment" && <div className="flex flex-col items-center justify-center gap-4 p-8">
          <i className="pi pi-spin pi-spinner text-6xl text-blue-600" />
          <p className="text-xl">Creating booking...</p>
          <p className="text-gray-600">Please wait while we confirm the request</p>
        </div>}

      {step === "success" && <div className="booking-receipt-panel">
          <div className="booking-receipt-header">
            <span className="booking-receipt-icon">
              <i className="pi pi-check" />
            </span>
            <div>
              <p className="booking-step-eyebrow">Booking Created</p>
              <div className="booking-receipt-title-row">
                <h3 className="booking-step-title">
                  {receiptBookingId || "Booking request received"}
                </h3>
                {receiptBookingId && (
                  <button
                    type="button"
                    className="booking-copy-button"
                    onClick={handleCopyBookingId}
                    aria-label="Copy booking id"
                  >
                    <i className={bookingIdCopied ? "pi pi-check" : "pi pi-copy"} />
                    <span>{bookingIdCopied ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>
              <p className="booking-receipt-subtitle">
                Status: {formatBookingStatus(createdBooking?.status || "pending")}
              </p>
            </div>
          </div>

          <Card className="booking-receipt-card">
            <div className="booking-receipt-rows">
              <div className="booking-receipt-row">
                <span>Guest</span>
                <strong>{selectedUser?.name || "-"}</strong>
              </div>
              <div className="booking-receipt-row">
                <span>Hotel</span>
                <strong>{selectedHotel?.name || "-"}</strong>
              </div>
              <div className="booking-receipt-row">
                <span>Stay</span>
                <strong>
                  {formatReceiptDate(createdBooking?.checkInDate || checkInDate)} -{" "}
                  {formatReceiptDate(createdBooking?.checkOutDate || checkOutDate)}
                </strong>
              </div>
              <div className="booking-receipt-row">
                <span>Room</span>
                <strong>
                  {formatRoomType(createdBooking?.roomType || selectedRoomType?.type || "")}
                </strong>
              </div>
              <div className="booking-receipt-row">
                <span>Guests</span>
                <strong>{createdBooking?.numberOfGuests || numberOfGuests}</strong>
              </div>
              <div className="booking-receipt-row">
                <span>Booked On</span>
                <strong>{formatReceiptDate(createdBooking?.bookingDate)}</strong>
              </div>
              <div className="booking-receipt-row">
                <span>Confirmation</span>
                <strong>{receiptConfirmed ? "Confirmed" : "Pending"}</strong>
              </div>
              <Divider />
              <div className="booking-receipt-total">
                <span>Total Amount</span>
                <strong>{formatCurrency(createdBooking?.totalAmount ?? calculateTotal())}</strong>
              </div>
            </div>
          </Card>

          {bookingConfirmError && (
            <div className="booking-confirm-error">
              <i className="pi pi-exclamation-circle" />
              <span>{bookingConfirmError}</span>
            </div>
          )}

          {bookingConfirming && (
            <div className="booking-confirm-loading">
              <i className="pi pi-spin pi-spinner" />
              <div>
                <strong>Confirming booking</strong>
                <span>Please wait while the booking status is updated.</span>
              </div>
            </div>
          )}

          {receiptConfirmed && (
            <div className="booking-confirm-success">
              <i className="pi pi-check-circle" />
              <div>
                <strong>Booking confirmed</strong>
                <span>The booking status has been updated successfully.</span>
              </div>
            </div>
          )}

          <div className={`booking-receipt-actions${receiptConfirmed ? " booking-receipt-actions-final" : ""}`}>
            <Button
    label="Close"
    icon="pi pi-times"
    onClick={handleHide}
    className="dialog-secondary-button p-button-outlined"
    disabled={bookingConfirming}
  />
            {!receiptConfirmed && (
            <Button
    label={bookingConfirming ? "Confirming" : "Confirm"}
    icon={bookingConfirming ? "pi pi-spin pi-spinner" : "pi pi-check-circle"}
    onClick={handleConfirmBooking}
    disabled={bookingConfirming}
    className="dialog-primary-button"
  />
            )}
          </div>
        </div>}
    </Dialog>;
}
export {
  CreateBookingDialog
};
