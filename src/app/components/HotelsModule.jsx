import { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Rating } from "primereact/rating";
import { Tag } from "primereact/tag";

function HotelsModule({ hotels }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null);

  const states = Array.from(new Set(hotels.map((hotel) => hotel.state))).sort();
  const cities = Array.from(
    new Set(
      hotels
        .filter((hotel) => !selectedState || hotel.state === selectedState)
        .map((hotel) => hotel.city)
    )
  ).sort();
  const ratingOptions = [
    { label: "All Ratings", value: null },
    { label: "4+ Stars", value: 4 },
    { label: "4.5+ Stars", value: 4.5 }
  ];

  const filteredHotels = hotels.filter((hotel) => {
    if (selectedState && hotel.state !== selectedState) return false;
    if (selectedCity && hotel.city !== selectedCity) return false;
    if (ratingFilter && hotel.rating < ratingFilter) return false;
    return true;
  });

  const availableRooms = filteredHotels.reduce(
    (sum, hotel) => sum + hotel.availableRooms,
    0
  );

  const ratingBodyTemplate = (rowData) => {
    return <Rating value={rowData.rating} readOnly cancel={false} />;
  };

  const roomTypesBodyTemplate = (rowData) => {
    const visibleRoomTypes = rowData.roomTypes.slice(0, 2);
    const hiddenCount = rowData.roomTypes.length - visibleRoomTypes.length;

    return (
      <div className="flex flex-wrap gap-1">
        {visibleRoomTypes.map((type) => (
          <Tag key={type} value={type} severity="info" />
        ))}
        {hiddenCount > 0 && <Tag value={`+${hiddenCount}`} severity="secondary" />}
      </div>
    );
  };

  const availabilityBodyTemplate = (rowData) => {
    const severity =
      rowData.availableRooms > 20
        ? "success"
        : rowData.availableRooms > 10
          ? "warning"
          : "danger";

    return (
      <Tag
        value={`${rowData.availableRooms} rooms`}
        severity={severity}
        icon="pi pi-home"
      />
    );
  };

  const dateBodyTemplate = (rowData) => {
    return rowData.joinedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <section className="module-page">
      <div className="module-toolbar module-toolbar-stacked">
        <div>
          <div className="module-eyebrow">Hotels</div>
          <h2 className="module-title">Hotels Management</h2>
          <p className="module-summary">
            {filteredHotels.length} hotels · {availableRooms} rooms available
          </p>
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
              setSelectedState(event.value);
              setSelectedCity(null);
            }}
            options={[
              { label: "All States", value: null },
              ...states.map((state) => ({ label: state, value: state }))
            ]}
            placeholder="State"
            className="module-filter"
            showClear
          />
          <Dropdown
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.value)}
            options={[
              { label: "All Cities", value: null },
              ...cities.map((city) => ({ label: city, value: city }))
            ]}
            placeholder="City"
            className="module-filter"
            showClear
          />
          <Dropdown
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.value)}
            options={ratingOptions}
            placeholder="Rating"
            className="module-filter"
          />
        </div>
      </div>

      <div className="module-table-shell">
        <DataTable
          value={filteredHotels}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilter={globalFilter}
          emptyMessage="No hotels found."
          className="dashboard-table p-datatable-sm"
          stripedRows
          sortMode="multiple"
          removableSort
          responsiveLayout="scroll"
        >
          <Column
            field="name"
            header="Hotel Name"
            sortable
            style={{ minWidth: "15rem" }}
          />
          <Column
            field="phoneNumber"
            header="Phone"
            sortable
            style={{ minWidth: "12rem" }}
          />
          <Column
            field="state"
            header="State"
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="city"
            header="City"
            sortable
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
            field="roomTypes"
            header="Room Types"
            body={roomTypesBodyTemplate}
            style={{ minWidth: "14rem" }}
          />
          <Column
            field="joinedDate"
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

export { HotelsModule };
