import { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { CreateBookingDialog } from "./CreateBookingDialog";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" }
];

function BookingsModule({ bookings, onBookingCreated }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === "paid") return booking.paid;
    if (statusFilter === "pending") return !booking.paid;
    return true;
  });

  const paidBookings = bookings.filter((booking) => booking.paid).length;
  const pendingBookings = bookings.length - paidBookings;

  const dateBodyTemplate = (rowData, field) => {
    const date = rowData[field];
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const paidBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paid ? "Paid" : "Pending"}
        severity={rowData.paid ? "success" : "warning"}
        icon={rowData.paid ? "pi pi-check" : "pi pi-clock"}
      />
    );
  };

  const amountBodyTemplate = (rowData) => {
    return (
      <span className="font-semibold">
        ${rowData.totalAmount.toLocaleString()}
      </span>
    );
  };

  const daysBodyTemplate = (rowData) => {
    const days = Math.ceil(
      (rowData.checkOutDate.getTime() - rowData.checkInDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <span>
        {days} {days === 1 ? "day" : "days"}
      </span>
    );
  };

  return (
    <section className="module-page">
      <div className="module-toolbar module-toolbar-stacked">
        <div>
          <div className="module-eyebrow">Bookings</div>
          <h2 className="module-title">Bookings Management</h2>
          <p className="module-summary">
            {bookings.length} bookings · {paidBookings} paid · {pendingBookings} pending
          </p>
        </div>

        <div className="module-controls">
          <div className="module-actions-group">
            <div className="status-segment" aria-label="Booking status filter">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={
                    statusFilter === filter.value
                      ? "status-segment-button active"
                      : "status-segment-button"
                  }
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
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
          </div>
          <Button
            label="Create Booking"
            icon="pi pi-plus"
            onClick={() => setShowCreateDialog(true)}
            className="module-primary-action p-button-raised"
          />
        </div>
      </div>

      <div className="module-table-shell">
        <DataTable
          value={filteredBookings}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilter={globalFilter}
          emptyMessage="No bookings found."
          className="dashboard-table p-datatable-sm"
          stripedRows
          sortMode="multiple"
          removableSort
          responsiveLayout="scroll"
        >
          <Column
            field="hotelName"
            header="Hotel"
            sortable
            style={{ minWidth: "15rem" }}
          />
          <Column
            field="userName"
            header="Guest"
            sortable
            style={{ minWidth: "12rem" }}
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
            header="Duration"
            body={daysBodyTemplate}
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="roomType"
            header="Room Type"
            sortable
            body={(rowData) => <Tag value={rowData.roomType} severity="info" />}
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
            field="paid"
            header="Status"
            sortable
            body={paidBodyTemplate}
            style={{ minWidth: "10rem" }}
          />
        </DataTable>
      </div>

      <CreateBookingDialog
        visible={showCreateDialog}
        onHide={() => setShowCreateDialog(false)}
        onBookingCreated={(booking) => {
          onBookingCreated(booking);
          setShowCreateDialog(false);
        }}
      />
    </section>
  );
}

export { BookingsModule };
