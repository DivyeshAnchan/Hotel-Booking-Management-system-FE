import { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";

function UsersModule({ users }) {
  const [globalFilter, setGlobalFilter] = useState("");

  const totalBookings = users.reduce(
    (sum, user) => sum + user.numberOfBookings,
    0
  );

  const dateBodyTemplate = (rowData, field) => {
    const date = rowData[field];
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <section className="module-page">
      <div className="module-toolbar">
        <div>
          <div className="module-eyebrow">Users</div>
          <h2 className="module-title">Users Management</h2>
          <p className="module-summary">
            {users.length} users · {totalBookings} total bookings
          </p>
        </div>

        <span className="module-search">
          <i className="pi pi-search module-search-icon" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search name or phone"
            className="module-search-input"
          />
        </span>
      </div>

      <div className="module-table-shell">
        <DataTable
          value={users}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilter={globalFilter}
          emptyMessage="No users found."
          className="dashboard-table p-datatable-sm"
          stripedRows
          sortMode="multiple"
          removableSort
          responsiveLayout="scroll"
        >
          <Column
            field="name"
            header="Name"
            sortable
            style={{ minWidth: "14rem" }}
          />
          <Column
            field="phoneNumber"
            header="Phone Number"
            sortable
            style={{ minWidth: "13rem" }}
          />
          <Column
            field="numberOfBookings"
            header="Bookings"
            sortable
            body={(rowData) => (
              <span className="metric-pill metric-pill-blue">
                {rowData.numberOfBookings}
              </span>
            )}
            style={{ minWidth: "9rem" }}
          />
          <Column
            field="joinedDate"
            header="Joined Date"
            sortable
            body={(rowData) => dateBodyTemplate(rowData, "joinedDate")}
            style={{ minWidth: "11rem" }}
          />
          <Column
            field="lastLoggedIn"
            header="Last Active"
            sortable
            body={(rowData) => dateBodyTemplate(rowData, "lastLoggedIn")}
            style={{ minWidth: "11rem" }}
          />
        </DataTable>
      </div>
    </section>
  );
}

export { UsersModule };
