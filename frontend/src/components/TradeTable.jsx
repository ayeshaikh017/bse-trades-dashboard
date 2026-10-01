const TradeTable = ({ trades }) => {
  if (trades.length === 0) {
    return (
      <div className="empty-state">
        <h3>No trades available</h3>
        <p>Start a pull to fetch trades from the BSE API.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Trade ID</th>
            <th>Client</th>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Timestamp</th>
          </tr>
        </thead>

        <tbody>
          {trades.map((trade) => (
            <tr key={trade.tradeId}>
              <td>{trade.tradeId}</td>
              <td>{trade.client}</td>
              <td>
                <strong>{trade.symbol}</strong>
              </td>
              <td>{trade.quantity}</td>
              <td>₹{trade.price.toFixed(2)}</td>
              <td>
                {new Date(trade.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeTable;