import { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const sortFieldMap = {
  name: "name",
  numberOfBookings: "bookings",
  joinedDate: "createdAt",
  lastLoggedIn: "lastSeen"
};

function mapUserFromApi(user) {
  return {
    id: user._id || user.id,
    name: user.name || "",
    email: user.email || "",
    phoneNumber: user.phone || user.phoneNumber || "",
    numberOfBookings: user.bookings ?? user.numberOfBookings ?? 0,
    joinedDate: user.joinedAt || user.createdAt ? new Date(user.joinedAt || user.createdAt) : null,
    lastLoggedIn: user.lastSeen || user.lastLoggedIn ? new Date(user.lastSeen || user.lastLoggedIn) : null
  };
}

function UsersModule() {
  const [users, setUsers] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState("joinedDate");
  const [sortOrder, setSortOrder] = useState(-1);
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

  const requestParams = useMemo(() => {
    const page = Math.floor(first / rows) + 1;
    const backendSortField = sortFieldMap[sortField] || "createdAt";
    const backendSortOrder = sortOrder === 1 ? "asc" : "desc";
    const params = new URLSearchParams({
      page: String(page),
      limit: String(rows),
      sortBy: backendSortField,
      sortOrder: backendSortOrder
    });

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    return params;
  }, [debouncedSearch, first, rows, sortField, sortOrder]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/users?${requestParams}`, {
          signal: controller.signal
        });
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch users");
        }

        setUsers(Array.isArray(json.data) ? json.data.map(mapUserFromApi) : []);
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
        setUsers([]);
        setPagination((currentPagination) => ({
          ...currentPagination,
          totalItems: 0
        }));
        setError(err.message || "Failed to fetch users");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => controller.abort();
  }, [requestParams]);

  const totalBookings = users.reduce(
    (sum, user) => sum + user.numberOfBookings,
    0
  );

  const dateBodyTemplate = (rowData, field) => {
    const date = rowData[field];
    if (!date) return "—";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handlePage = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const handleSort = (event) => {
    setSortField(event.sortField || "joinedDate");
    setSortOrder(event.sortOrder || -1);
    setFirst(0);
  };

  return (
    <section className="module-page">
      <div className="module-toolbar">
        <div>
          <div className="module-eyebrow">Users</div>
          <h2 className="module-title">Users Management</h2>
          <p className="module-summary">
            {pagination.totalItems} users · {totalBookings} bookings on this page
          </p>
          {error && <p className="module-error">{error}</p>}
        </div>

        <span className="module-search">
          <i className="pi pi-search module-search-icon" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search name or email or phone"
            className="module-search-input"
          />
        </span>
      </div>

      <div className="module-table-shell">
        <DataTable
          value={users}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={pagination.totalItems}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage={loading ? "Loading users..." : "No users found."}
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
            field="name"
            header="Name"
            sortable
            style={{ minWidth: "14rem" }}
          />
          <Column
            field="email"
            header="Email"
            style={{ minWidth: "18rem" }}
          />
          <Column
            field="phoneNumber"
            header="Phone Number"
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
