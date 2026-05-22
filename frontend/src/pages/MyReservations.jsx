import './ContentPages.css';

const MyReservations = () => {
  return (
    <main className="page">
      <div className="page__header">
        <h1>My Reservations</h1>
        <p>Your reservations will appear here once the reservation service is available.</p>
      </div>
      <section className="content-panel">
        <p>No reservations to show yet.</p>
      </section>
    </main>
  );
};

export default MyReservations;
