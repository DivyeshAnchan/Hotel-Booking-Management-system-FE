import { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Rating } from "primereact/rating";
import { Tag } from "primereact/tag";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const sortFieldMap = {
  name: "name",
  rating: "rating",
  totalBooked: "totalBooked",
  availableRooms: "availableRooms",
  createdAt: "createdAt"
};

const ratingOptions = [
  { label: "All Ratings", value: null },
  { label: "4+ Stars", value: 4 },
  { label: "4.5+ Stars", value: 4.5 }
];

const statusOptions = [
  { label: "All Status", value: null },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" }
];

function mapHotelFromApi(hotel) {
  return {
    id: hotel._id || hotel.id,
    name: hotel.name || "",
    location: hotel.location || "",
    phoneNumber: hotel.phone || hotel.phoneNumber || "",
    state: hotel.state || "",
    city: hotel.city || "",
    country: hotel.country || "",
    rating: hotel.rating ?? 0,
    totalBooked: hotel.totalBooked ?? 0,
    availableRooms: hotel.availableRooms ?? 0,
    isActive: Boolean(hotel.isActive),
    createdAt: hotel.createdAt ? new Date(hotel.createdAt) : null
  };
}

function HotelsModule() {
  const [hotels, setHotels] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState(-1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    cities: []
  });
  const [stateCityOptions, setStateCityOptions] = useState([]);
  const [cityOptionsLoading, setCityOptionsLoading] = useState(false);

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

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (isActiveFilterValue(selectedState)) params.set("state", selectedState);
    if (isActiveFilterValue(selectedCity)) params.set("city", selectedCity);
    if (isActiveFilterValue(ratingFilter)) params.set("rating", String(ratingFilter));
    if (isActiveFilterValue(statusFilter)) params.set("status", statusFilter);

    return params;
  }, [
    debouncedSearch,
    first,
    ratingFilter,
    rows,
    selectedCity,
    selectedState,
    sortField,
    sortOrder,
    statusFilter
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHotels() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/hotels?${requestParams}`, {
          signal: controller.signal
        });
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch hotels");
        }

        const mappedHotels = Array.isArray(json.data)
          ? json.data.map(mapHotelFromApi)
          : [];

        setHotels(mappedHotels);
        setPagination({
          totalItems: json.pagination?.totalItems ?? 0,
          currentPage: json.pagination?.currentPage ?? 1,
          totalPages: json.pagination?.totalPages ?? 1,
          limit: json.pagination?.limit ?? rows,
          hasNextPage: Boolean(json.pagination?.hasNextPage),
          hasPreviousPage: Boolean(json.pagination?.hasPreviousPage)
        });
        setFilterOptions((currentOptions) => ({
          states: mergeUniqueOptions(
            currentOptions.states,
            mappedHotels.map((hotel) => hotel.state)
          ),
          cities: mergeUniqueOptions(
            currentOptions.cities,
            mappedHotels.map((hotel) => hotel.city)
          )
        }));
      } catch (err) {
        if (err.name === "AbortError") return;
        setHotels([]);
        setPagination((currentPagination) => ({
          ...currentPagination,
          totalItems: 0
        }));
        setError(err.message || "Failed to fetch hotels");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHotels();

    return () => controller.abort();
  }, [requestParams]);

  useEffect(() => {
    if (!isActiveFilterValue(selectedState)) {
      setStateCityOptions([]);
      setCityOptionsLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadCitiesForState() {
      setStateCityOptions([]);
      setCityOptionsLoading(true);

      try {
        const cities = await fetchCitiesForState(selectedState, controller.signal);

        setStateCityOptions(cities);
        setFilterOptions((currentOptions) => ({
          ...currentOptions,
          cities: mergeUniqueOptions(currentOptions.cities, cities)
        }));
      } catch (err) {
        if (err.name === "AbortError") return;
        setStateCityOptions([]);
      } finally {
        if (!controller.signal.aborted) {
          setCityOptionsLoading(false);
        }
      }
    }

    loadCitiesForState();

    return () => controller.abort();
  }, [selectedState]);

  const availableRooms = hotels.reduce(
    (sum, hotel) => sum + hotel.availableRooms,
    0
  );

  const stateOptions = [
    { label: "All States", value: null },
    ...filterOptions.states.map((state) => ({ label: state, value: state }))
  ];
  const visibleCityOptions = isActiveFilterValue(selectedState)
    ? stateCityOptions
    : filterOptions.cities;
  const cityOptions = [
    { label: "All Cities", value: null },
    ...visibleCityOptions.map((city) => ({ label: city, value: city }))
  ];

  const ratingBodyTemplate = (rowData) => {
    return <Rating value={rowData.rating} readOnly cancel={false} />;
  };

  const availabilityBodyTemplate = (rowData) => {
    return (
      <Tag
        value={`${rowData.availableRooms} rooms`}
        icon="pi pi-home"
        className="availability-tag"
      />
    );
  };

  const statusBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.isActive ? "Active" : "Inactive"}
        icon={rowData.isActive ? "pi pi-check-circle" : "pi pi-times-circle"}
        className={rowData.isActive ? "status-tag status-tag-active" : "status-tag status-tag-inactive"}
      />
    );
  };

  const dateBodyTemplate = (rowData) => {
    if (!rowData.createdAt) return "—";

    return rowData.createdAt.toLocaleDateString("en-US", {
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
    setSortField(event.sortField || "createdAt");
    setSortOrder(event.sortOrder || -1);
    setFirst(0);
  };

  const resetPageAndSetState = (setter, value) => {
    setFirst(0);
    setter(value);
  };

  return (
    <section className="module-page">
      <div className="module-toolbar module-toolbar-stacked">
        <div>
          <div className="module-eyebrow">Hotels</div>
          <h2 className="module-title">Hotels Management</h2>
          <p className="module-summary">
            {pagination.totalItems} hotels · {availableRooms} rooms on this page
          </p>
          {error && <p className="module-error">{error}</p>}
        </div>

        <div className="module-controls">
          <span className="module-search">
            <i className="pi pi-search module-search-icon" />
            <InputText
              type="search"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search hotels"
              className="module-search-input"
            />
          </span>
          <Dropdown
            value={selectedState}
            onChange={(event) => {
              setSelectedCity(null);
              resetPageAndSetState(setSelectedState, event.value);
            }}
            options={stateOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="State"
            className="module-filter"
            showClear
          />
          <Dropdown
            value={selectedCity}
            onChange={(event) => resetPageAndSetState(setSelectedCity, event.value)}
            options={cityOptions}
            optionLabel="label"
            optionValue="value"
            placeholder={cityOptionsLoading ? "Loading cities..." : "City"}
            className="module-filter"
            showClear
            disabled={cityOptionsLoading}
          />
          <Dropdown
            value={ratingFilter}
            onChange={(event) => resetPageAndSetState(setRatingFilter, event.value)}
            options={ratingOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Rating"
            className="module-filter"
          />
          <Dropdown
            value={statusFilter}
            onChange={(event) => resetPageAndSetState(setStatusFilter, event.value)}
            options={statusOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            className="module-filter"
          />
        </div>
      </div>

      <div className="module-table-shell">
        <DataTable
          value={hotels}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={pagination.totalItems}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage={loading ? "Loading hotels..." : "No hotels found."}
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
            header="Hotel Name"
            sortable
            style={{ minWidth: "15rem" }}
          />
          <Column
            field="location"
            header="Location"
            style={{ minWidth: "12rem" }}
          />
          <Column
            field="phoneNumber"
            header="Phone"
            style={{ minWidth: "12rem" }}
          />
          <Column
            field="state"
            header="State"
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="city"
            header="City"
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="rating"
            header="Rating"
            sortable
            body={ratingBodyTemplate}
            style={{ minWidth: "12rem" }}
          />
          <Column
            field="totalBooked"
            header="Total Booked"
            sortable
            body={(rowData) => (
              <span className="metric-pill metric-pill-green">
                {rowData.totalBooked}
              </span>
            )}
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="availableRooms"
            header="Availability"
            sortable
            body={availabilityBodyTemplate}
            style={{ minWidth: "11rem" }}
          />
          <Column
            field="isActive"
            header="Status"
            body={statusBodyTemplate}
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="createdAt"
            header="Joined"
            sortable
            body={dateBodyTemplate}
            style={{ minWidth: "10rem" }}
          />
        </DataTable>
      </div>
    </section>
  );
}

function mergeUniqueOptions(existingOptions, nextOptions) {
  return Array.from(
    new Set([
      ...existingOptions,
      ...nextOptions.filter((option) => Boolean(option))
    ])
  ).sort();
}

async function fetchCitiesForState(state, signal) {
  const cities = [];
  let page = 1;
  let totalPages = 1;

  do {
    const params = new URLSearchParams({
      page: String(page),
      limit: "100",
      state,
      sortBy: "name",
      sortOrder: "asc"
    });
    const response = await fetch(`${API_BASE_URL}/hotels?${params}`, { signal });
    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to fetch cities");
    }

    cities.push(
      ...(Array.isArray(json.data) ? json.data.map((hotel) => hotel.city) : [])
    );

    totalPages = json.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return mergeUniqueOptions([], cities);
}

function isActiveFilterValue(value) {
  return value !== null && value !== undefined && value !== "";
}

export { HotelsModule };
