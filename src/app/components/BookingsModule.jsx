import { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { CreateBookingDialog } from "./CreateBookingDialog";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const statusFilters = [
  { label: "All Status", value: null },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" }
];

const statusMeta = {
  confirmed: {
    label: "Confirmed",
    icon: "pi pi-check-circle",
    className: "booking-status booking-status-confirmed"
  },
  pending: {
    label: "Pending",
    icon: "pi pi-clock",
    className: "booking-status booking-status-pending"
  },
  completed: {
    label: "Completed",
    icon: "pi pi-verified",
    className: "booking-status booking-status-completed"
  },
  cancelled: {
    label: "Cancelled",
    icon: "pi pi-times-circle",
    className: "booking-status booking-status-cancelled"
  }
};

const sortFieldMap = {
  bookingNumber: "bookingNumber",
  bookingDate: "bookingDate",
  checkInDate: "checkInDate",
  checkOutDate: "checkOutDate",
  duration: "duration",
  numberOfGuests: "numberOfGuests",
  roomType: "roomType",
  status: "status"
};

function BookingsModule() {
  const [bookings, setBookings] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [debouncedRoomType, setDebouncedRoomType] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [bookingDateRange, setBookingDateRange] = useState(null);
  const [checkInDateRange, setCheckInDateRange] = useState(null);
  const [checkOutDateRange, setCheckOutDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState("bookingDate");
  const [sortOrder, setSortOrder] = useState(-1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingAction, setBookingAction] = useState({
    type: null,
    loading: false,
    error: "",
    success: ""
  });
  const [pagination, setPagination] = useState({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFirst(0);
      setDebouncedSearch(globalFilter.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [globalFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFirst(0);
      setDebouncedRoomType(roomTypeFilter.trim().toLowerCase());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [roomTypeFilter]);

  const requestParams = useMemo(() => {
    const page = Math.floor(first / rows) + 1;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(rows),
      sortBy: sortFieldMap[sortField] || "bookingDate",
      sortOrder: sortOrder === 1 ? "asc" : "desc"
    });

    addTextParam(params, "search", debouncedSearch);
    addTextParam(params, "roomType", debouncedRoomType);
    addTextParam(params, "status", statusFilter);
    addDateRangeParams(params, "bookingDate", bookingDateRange);
    addDateRangeParams(params, "checkInDate", checkInDateRange);
    addDateRangeParams(params, "checkOutDate", checkOutDateRange);

    return params;
  }, [
    bookingDateRange,
    checkInDateRange,
    checkOutDateRange,
    debouncedRoomType,
    debouncedSearch,
    first,
    rows,
    sortField,
    sortOrder,
    statusFilter
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBookings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/bookings?${requestParams}`, {
          signal: controller.signal
        });
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch bookings");
        }

        setBookings(Array.isArray(json.data) ? json.data.map(mapBookingFromApi) : []);
        setPagination({
          totalItems: json.pagination?.totalItems ?? 0,
          currentPage: json.pagination?.currentPage ?? 1,
          totalPages: json.pagination?.totalPages ?? 1,
          limit: json.pagination?.limit ?? rows,
          hasNextPage: Boolean(json.pagination?.hasNextPage),
          hasPreviousPage: Boolean(json.pagination?.hasPreviousPage)
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        setBookings([]);
        setPagination((currentPagination) => ({
          ...currentPagination,
          totalItems: 0
        }));
        setError(err.message || "Failed to fetch bookings");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => controller.abort();
  }, [requestParams, refreshKey, rows]);

  const statusCounts = bookings.reduce(
    (counts, booking) => ({
      ...counts,
      [booking.status]: (counts[booking.status] || 0) + 1
    }),
    {}
  );

  const hasDateFilters =
    hasDateRange(bookingDateRange) ||
    hasDateRange(checkInDateRange) ||
    hasDateRange(checkOutDateRange);
  const hasActiveFilters =
    Boolean(globalFilter.trim()) ||
    Boolean(roomTypeFilter.trim()) ||
    Boolean(statusFilter) ||
    hasDateFilters;

  const dateBodyTemplate = (rowData, field) => {
    const date = rowData[field];
    if (!date) return "-";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const statusBodyTemplate = (rowData) => {
    const meta = statusMeta[rowData.status] || statusMeta.pending;

    return (
      <Tag
        value={meta.label}
        icon={meta.icon}
        className={meta.className}
      />
    );
  };

  const hotelBodyTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold text-slate-900">{rowData.hotelName}</div>
        <div className="text-xs text-slate-500">{rowData.hotelLocation}</div>
      </div>
    );
  };

  const guestBodyTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold text-slate-900">{rowData.userName}</div>
        <div className="text-xs text-slate-500">{rowData.userEmail}</div>
      </div>
    );
  };

  const clearFilters = () => {
    setFirst(0);
    setGlobalFilter("");
    setRoomTypeFilter("");
    setStatusFilter(null);
    setBookingDateRange(null);
    setCheckInDateRange(null);
    setCheckOutDateRange(null);
  };

  const handlePage = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const handleSort = (event) => {
    setSortField(event.sortField || "bookingDate");
    setSortOrder(event.sortOrder || -1);
    setFirst(0);
  };

  const handleBookingCreated = () => {
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const handleBookingDetailsHide = () => {
    if (bookingAction.loading) return;
    setSelectedBooking(null);
    resetBookingAction();
  };

  const resetBookingAction = () => {
    setBookingAction({
      type: null,
      loading: false,
      error: "",
      success: ""
    });
  };

  const updateBookingAfterAction = (updatedBooking) => {
    setSelectedBooking(updatedBooking);
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBooking || !canConfirmBooking(selectedBooking.status)) return;

    setBookingAction({
      type: "confirm",
      loading: true,
      error: "",
      success: ""
    });

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${selectedBooking.id}/status`, {
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

      const updatedBooking = mergeBookingUpdate(selectedBooking, json.data, "confirmed");

      updateBookingAfterAction(updatedBooking);
      setBookingAction({
        type: "confirm",
        loading: false,
        error: "",
        success: "Booking confirmed successfully."
      });
    } catch (err) {
      setBookingAction({
        type: "confirm",
        loading: false,
        error: err.message || "Failed to confirm booking",
        success: ""
      });
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !canCancelBooking(selectedBooking.status)) return;

    setBookingAction({
      type: "cancel",
      loading: true,
      error: "",
      success: ""
    });

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${selectedBooking.id}/cancel`, {
        method: "PATCH"
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to cancel booking");
      }

      const updatedBooking = mergeBookingUpdate(selectedBooking, json.data, "cancelled");

      updateBookingAfterAction(updatedBooking);
      setBookingAction({
        type: "cancel",
        loading: false,
        error: "",
        success: "Booking cancelled successfully."
      });
    } catch (err) {
      setBookingAction({
        type: "cancel",
        loading: false,
        error: err.message || "Failed to cancel booking",
        success: ""
      });
    }
  };

  return (
    <section className="module-page">
      <div className="module-toolbar bookings-toolbar">
        <div className="bookings-toolbar-header">
          <div>
            <div className="module-eyebrow">Bookings</div>
            <h2 className="module-title">Bookings Management</h2>
            <p className="module-summary">
              {pagination.totalItems} bookings · {statusCounts.confirmed || 0} confirmed on this page ·{" "}
              {statusCounts.pending || 0} pending on this page
            </p>
            {error && <p className="module-error">{error}</p>}
          </div>

          <Button
            label="Create Booking"
            icon="pi pi-plus"
            onClick={() => setShowCreateDialog(true)}
            className="module-primary-action bookings-create-action p-button-raised"
          />
        </div>

        <div className="bookings-filter-bar" aria-label="Booking filters">
          <Dropdown
            value={statusFilter}
            onChange={(event) => {
              setFirst(0);
              setStatusFilter(event.value);
            }}
            options={statusFilters}
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            className="module-filter"
            showClear
          />
          <span className="module-search">
            <i className="pi pi-search module-search-icon" />
            <InputText
              type="search"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search bookings"
              className="module-search-input"
            />
          </span>
          <InputText
            type="search"
            value={roomTypeFilter}
            onChange={(event) => setRoomTypeFilter(event.target.value)}
            placeholder="Room type"
            className="module-compact-input"
          />
          <Calendar
            value={bookingDateRange}
            onChange={(event) => {
              setFirst(0);
              setBookingDateRange(event.value);
            }}
            placeholder="Booking dates"
            className="module-date-filter"
            inputClassName="module-date-input"
            selectionMode="range"
            readOnlyInput
            hideOnRangeSelection
            showIcon
          />
          <Calendar
            value={checkInDateRange}
            onChange={(event) => {
              setFirst(0);
              setCheckInDateRange(event.value);
            }}
            placeholder="Check-in dates"
            className="module-date-filter"
            inputClassName="module-date-input"
            selectionMode="range"
            readOnlyInput
            hideOnRangeSelection
            showIcon
          />
          <Calendar
            value={checkOutDateRange}
            onChange={(event) => {
              setFirst(0);
              setCheckOutDateRange(event.value);
            }}
            placeholder="Check-out dates"
            className="module-date-filter"
            inputClassName="module-date-input"
            selectionMode="range"
            readOnlyInput
            hideOnRangeSelection
            showIcon
          />
          {hasActiveFilters && (
            <Button
              label="Clear"
              icon="pi pi-filter-slash"
              onClick={clearFilters}
              className="module-secondary-action bookings-clear-action"
            />
          )}
        </div>
      </div>

      <div className="module-table-shell">
        <DataTable
          value={bookings}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={pagination.totalItems}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage={loading ? "Loading bookings..." : "No bookings found."}
          className="dashboard-table bookings-table p-datatable-sm"
          stripedRows
          sortField={sortField}
          sortOrder={sortOrder}
          onPage={handlePage}
          onSort={handleSort}
          onRowClick={(event) => {
            setSelectedBooking(event.data);
            resetBookingAction();
          }}
          removableSort={false}
          responsiveLayout="scroll"
          dataKey="id"
        >
          <Column
            field="bookingNumber"
            header="Booking #"
            sortable
            style={{ minWidth: "8.5rem" }}
          />
          <Column
            field="hotelName"
            header="Hotel"
            body={hotelBodyTemplate}
            style={{ minWidth: "13rem" }}
          />
          <Column
            field="userName"
            header="Guest"
            body={guestBodyTemplate}
            style={{ minWidth: "12rem" }}
          />
          <Column
            field="bookingDate"
            header="Booked Date"
            sortable
            body={(rowData) => dateBodyTemplate(rowData, "bookingDate")}
            style={{ minWidth: "9.25rem" }}
          />
          <Column
            field="checkInDate"
            header="Check-In"
            sortable
            body={(rowData) => dateBodyTemplate(rowData, "checkInDate")}
            style={{ minWidth: "9rem" }}
          />
          <Column
            field="checkOutDate"
            header="Check-Out"
            sortable
            body={(rowData) => dateBodyTemplate(rowData, "checkOutDate")}
            style={{ minWidth: "9rem" }}
          />
          <Column
            field="numberOfGuests"
            header="Guests"
            sortable
            body={(rowData) => (
              <span className="metric-pill metric-pill-purple">
                {rowData.numberOfGuests}
              </span>
            )}
            style={{ minWidth: "6.5rem" }}
          />
          <Column
            field="duration"
            header="Duration"
            sortable
            body={(rowData) => (
              <span>
                {rowData.duration} {rowData.duration === 1 ? "day" : "days"}
              </span>
            )}
            style={{ minWidth: "7.25rem" }}
          />
          <Column
            field="roomType"
            header="Room Type"
            sortable
            body={(rowData) => <Tag value={formatRoomType(rowData.roomType)} severity="info" />}
            style={{ minWidth: "8.5rem" }}
          />
          <Column
            field="status"
            header="Status"
            sortable
            body={statusBodyTemplate}
            style={{ minWidth: "9rem" }}
          />
        </DataTable>
      </div>

      <CreateBookingDialog
        visible={showCreateDialog}
        onHide={() => setShowCreateDialog(false)}
        onBookingCreated={handleBookingCreated}
      />

      <BookingDetailsDialog
        booking={selectedBooking}
        bookingAction={bookingAction}
        onConfirm={handleConfirmBooking}
        onCancel={handleCancelBooking}
        onHide={handleBookingDetailsHide}
      />
    </section>
  );
}

function BookingDetailsDialog({
  booking,
  bookingAction,
  onConfirm,
  onCancel,
  onHide
}) {
  if (!booking) return null;

  const canCancel = canCancelBooking(booking.status);
  const canConfirm = canConfirmBooking(booking.status);
  const hasActions = canConfirm || canCancel;
  const actionLoading = bookingAction.loading;
  const meta = statusMeta[booking.status] || statusMeta.pending;
  const successTitle = bookingAction.type === "confirm" ? "Booking confirmed" : "Booking cancelled";
  const cancelling = actionLoading && bookingAction.type === "cancel";
  const confirming = actionLoading && bookingAction.type === "confirm";

  return (
    <Dialog
      visible={Boolean(booking)}
      onHide={onHide}
      header="Booking Details"
      style={{ width: "90vw", maxWidth: "900px" }}
      modal
      dismissableMask={!actionLoading}
      closable={!actionLoading}
    >
      <div className="booking-receipt-panel booking-details-panel">
        <div className="booking-receipt-header">
          <span className="booking-receipt-icon booking-details-icon">
            <i className={meta.icon} />
          </span>
          <div>
            <p className="booking-step-eyebrow">Booking Record</p>
            <div className="booking-receipt-title-row">
              <h3 className="booking-step-title">
                {booking.bookingNumber || "Booking details"}
              </h3>
              <Tag value={meta.label} icon={meta.icon} className={meta.className} />
            </div>
            <p className="booking-receipt-subtitle">
              Created {formatDisplayDate(booking.bookingDate)}
            </p>
          </div>
        </div>

        <Card className="booking-receipt-card">
          <div className="booking-receipt-rows">
            <div className="booking-receipt-row">
              <span>Guest</span>
              <strong>{booking.userName || "-"}</strong>
            </div>
            <div className="booking-receipt-row">
              <span>Guest Email</span>
              <strong>{booking.userEmail || "-"}</strong>
            </div>
            <div className="booking-receipt-row">
              <span>Hotel</span>
              <strong>{booking.hotelName || "-"}</strong>
            </div>
            <div className="booking-receipt-row">
              <span>Hotel Location</span>
              <strong>{booking.hotelLocation || "-"}</strong>
            </div>
            <div className="booking-receipt-row">
              <span>Stay</span>
              <strong>
                {formatDisplayDate(booking.checkInDate)} - {formatDisplayDate(booking.checkOutDate)}
              </strong>
            </div>
            <div className="booking-receipt-row">
              <span>Duration</span>
              <strong>
                {booking.duration} {booking.duration === 1 ? "day" : "days"}
              </strong>
            </div>
            <div className="booking-receipt-row">
              <span>Room</span>
              <strong>{formatRoomType(booking.roomType)}</strong>
            </div>
            <div className="booking-receipt-row">
              <span>Guests</span>
              <strong>{booking.numberOfGuests}</strong>
            </div>
            <div className="booking-receipt-row">
              <span>Confirmation</span>
              <strong>{meta.label}</strong>
            </div>
            <Divider />
            <div className="booking-receipt-total">
              <span>Total Amount</span>
              <strong>₹{booking.totalAmount.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </Card>

        {bookingAction.error && (
          <div className="booking-confirm-error">
            <i className="pi pi-exclamation-circle" />
            <span>{bookingAction.error}</span>
          </div>
        )}

        {bookingAction.success && (
          <div className="booking-confirm-success">
            <i className="pi pi-check-circle" />
            <div>
              <strong>{successTitle}</strong>
              <span>{bookingAction.success}</span>
            </div>
          </div>
        )}

        <div
          className={`booking-receipt-actions${!hasActions ? " booking-receipt-actions-final" : ""}${
            canConfirm && canCancel ? " booking-receipt-actions-triple" : ""
          }`}
        >
          <Button
            label="Close"
            onClick={onHide}
            className="dialog-secondary-button booking-receipt-close-button p-button-outlined"
            disabled={actionLoading}
          />
          {canConfirm && (
            <Button
              label={confirming ? "Confirming" : "Confirm Booking"}
              icon={confirming ? "pi pi-spin pi-spinner" : "pi pi-check-circle"}
              onClick={onConfirm}
              className="booking-confirm-action"
              disabled={actionLoading}
            />
          )}
          {canCancel && (
            <Button
              label={cancelling ? "Cancelling" : "Cancel Booking"}
              icon={cancelling ? "pi pi-spin pi-spinner" : "pi pi-times-circle"}
              onClick={onCancel}
              className="booking-cancel-action"
              disabled={actionLoading}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}

function mapBookingFromApi(booking) {
  const checkInDate = booking.checkInDate ? new Date(booking.checkInDate) : null;
  const checkOutDate = booking.checkOutDate ? new Date(booking.checkOutDate) : null;
  const fallbackDuration =
    checkInDate && checkOutDate
      ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  return {
    id: booking._id || booking.id,
    bookingNumber: booking.bookingNumber || "-",
    userId: booking.user?._id || booking.userId || "",
    userName: booking.user?.name || booking.userName || "",
    userEmail: booking.user?.email || "",
    userPhone: booking.user?.phone || "",
    hotelId: booking.hotel?._id || booking.hotelId || "",
    hotelName: booking.hotel?.name || booking.hotelName || "",
    hotelLocation: formatHotelLocation(booking.hotel),
    hotelPhone: booking.hotel?.phone || "",
    roomType: booking.roomType || "",
    checkInDate,
    checkOutDate,
    duration: booking.duration ?? fallbackDuration,
    numberOfGuests: booking.numberOfGuests ?? 0,
    status: booking.status || "pending",
    totalAmount: booking.totalAmount ?? 0,
    bookingDate: booking.bookingDate ? new Date(booking.bookingDate) : null
  };
}

function mergeBookingUpdate(currentBooking, apiBooking, fallbackStatus) {
  if (!apiBooking) {
    return {
      ...currentBooking,
      status: fallbackStatus || currentBooking.status
    };
  }

  const mappedBooking = mapBookingFromApi(apiBooking);

  return {
    ...currentBooking,
    ...mappedBooking,
    id: mappedBooking.id || currentBooking.id,
    bookingNumber: mappedBooking.bookingNumber || currentBooking.bookingNumber,
    userName: mappedBooking.userName || currentBooking.userName,
    userEmail: mappedBooking.userEmail || currentBooking.userEmail,
    userPhone: mappedBooking.userPhone || currentBooking.userPhone,
    hotelName: mappedBooking.hotelName || currentBooking.hotelName,
    hotelLocation: mappedBooking.hotelLocation || currentBooking.hotelLocation,
    hotelPhone: mappedBooking.hotelPhone || currentBooking.hotelPhone,
    roomType: mappedBooking.roomType || currentBooking.roomType,
    status: mappedBooking.status || fallbackStatus || currentBooking.status
  };
}

function addTextParam(params, key, value) {
  if (value !== null && value !== undefined && value !== "") {
    params.set(key, value);
  }
}

function addDateRangeParams(params, key, range) {
  if (!Array.isArray(range)) return;

  const [from, to] = range;
  if (from) params.set(`${key}From`, toApiDate(from));
  if (to) params.set(`${key}To`, toApiDate(to));
}

function toApiDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function hasDateRange(range) {
  return Array.isArray(range) && (range[0] || range[1]);
}

function formatRoomType(roomType) {
  if (!roomType) return "-";

  return roomType
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDisplayDate(date) {
  if (!date) return "-";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function canCancelBooking(status) {
  return status === "pending" || status === "confirmed";
}

function canConfirmBooking(status) {
  return status === "pending";
}

function formatHotelLocation(hotel) {
  if (!hotel) return "";

  return [hotel.location, hotel.city, hotel.state].filter(Boolean).join(", ");
}

export { BookingsModule };
