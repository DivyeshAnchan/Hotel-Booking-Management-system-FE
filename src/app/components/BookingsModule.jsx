import { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
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
  totalAmount: "totalAmount",
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

  const amountBodyTemplate = (rowData) => {
    return (
      <span className="font-semibold">
        ₹{rowData.totalAmount.toLocaleString("en-IN")}
      </span>
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
    setShowCreateDialog(false);
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
          className="dashboard-table p-datatable-sm"
          stripedRows
          sortField={sortField}
          sortOrder={sortOrder}
          onPage={handlePage}
          onSort={handleSort}
          removableSort={false}
          responsiveLayout="scroll"
          dataKey="id"
        >
          <Column
            field="bookingNumber"
            header="Booking #"
            sortable
            style={{ minWidth: "11rem" }}
          />
          <Column
            field="hotelName"
            header="Hotel"
            body={hotelBodyTemplate}
            style={{ minWidth: "16rem" }}
          />
          <Column
            field="userName"
            header="Guest"
            body={guestBodyTemplate}
            style={{ minWidth: "15rem" }}
          />
          <Column
            field="bookingDate"
            header="Booked Date"
            sortable
            body={(rowData) => dateBodyTemplate(rowData, "bookingDate")}
            style={{ minWidth: "11rem" }}
          />
          <Column
            field="checkInDate"
            header="Check-In"
            sortable
            body={(rowData) => dateBodyTemplate(rowData, "checkInDate")}
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="checkOutDate"
            header="Check-Out"
            sortable
            body={(rowData) => dateBodyTemplate(rowData, "checkOutDate")}
            style={{ minWidth: "10rem" }}
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
            style={{ minWidth: "8rem" }}
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
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="roomType"
            header="Room Type"
            sortable
            body={(rowData) => <Tag value={formatRoomType(rowData.roomType)} severity="info" />}
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="totalAmount"
            header="Amount"
            sortable
            body={amountBodyTemplate}
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="status"
            header="Status"
            sortable
            body={statusBodyTemplate}
            style={{ minWidth: "11rem" }}
          />
        </DataTable>
      </div>

      <CreateBookingDialog
        visible={showCreateDialog}
        onHide={() => setShowCreateDialog(false)}
        onBookingCreated={handleBookingCreated}
      />
    </section>
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

function formatHotelLocation(hotel) {
  if (!hotel) return "";

  return [hotel.location, hotel.city, hotel.state].filter(Boolean).join(", ");
}

export { BookingsModule };
