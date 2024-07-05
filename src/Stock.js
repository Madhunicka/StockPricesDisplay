import React from 'react';
import Plot from 'react-plotly.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Stock.css'; 

class Stock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stockChartXValues: [],
            stockChartYValues: [],
            stockSymbol: 'AMZN', 
            suggestions: [],
            query: '',
            loading: false,
            showSuggestions: false,
            fromDate: null, 
            toDate: null     
        };
    }

    componentDidMount() {
        this.fetchStock();
    }

    fetchStock() {
        const { stockSymbol, fromDate, toDate } = this.state;
        const API_KEY = process.env.REACT_APP_POLYGON_API_KEY; 
        const fromDateString = fromDate ? fromDate.toISOString().split('T')[0] : '2023-06-01'; 
        const toDateString = toDate ? toDate.toISOString().split('T')[0] : '2023-07-01'; 
        const API_call = `https://api.polygon.io/v2/aggs/ticker/${stockSymbol}/range/1/day/${fromDateString}/${toDateString}?apiKey=${API_KEY}`;

        this.setState({ loading: true });

        fetch(API_call)
            .then(response => response.json())
            .then(data => {
                console.log(data);

                const stockChartXValuesFunction = [];
                const stockChartYValuesFunction = [];

                data.results.forEach(entry => {
                    const date = new Date(entry.t);
                    stockChartXValuesFunction.push(date.toLocaleDateString());
                    stockChartYValuesFunction.push(entry.o); // 'o' for open price
                });

                this.setState({
                    stockChartXValues: stockChartXValuesFunction,
                    stockChartYValues: stockChartYValuesFunction,
                    loading: false
                });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                this.setState({ loading: false });
            });
    }

    handleInputChange = (event) => {
        const query = event.target.value;
        this.setState({ query, showSuggestions: true }, () => {
            if (query.length > 1) {
                this.getSuggestions(query);
            } else {
                this.setState({ suggestions: [] });
            }
        });
    };

    handleFromDateChange = (date) => {
        this.setState({ fromDate: date }, () => {
            if (this.state.toDate) {
                this.fetchStock();
            }
        });
    };

    handleToDateChange = (date) => {
        this.setState({ toDate: date }, () => {
            if (this.state.fromDate) {
                this.fetchStock();
            }
        });
    };

    getSuggestions = (query) => {
        const API_KEY = process.env.REACT_APP_POLYGON_API_KEY; 
        const API_call = `https://api.polygon.io/v3/reference/tickers?search=${query}&apiKey=${API_KEY}`;

        fetch(API_call)
            .then(response => response.json())
            .then(data => {
                const suggestions = data.results.map(item => item.ticker);
                this.setState({ suggestions });
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
            });
    };

    handleSuggestionClick = (symbol) => {
        this.setState({ stockSymbol: symbol, suggestions: [], query: '', showSuggestions: false }, () => {
            this.fetchStock();
        });
    };

    renderSuggestions() {
        const { suggestions } = this.state;
        if (suggestions.length === 0) {
            return null;
        }

        return (
            <ul className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                    <li key={index} onClick={() => this.handleSuggestionClick(suggestion)}>
                        {suggestion}
                    </li>
                ))}
            </ul>
        );
    }

    render() {
        const { stockChartXValues, stockChartYValues, query, loading, showSuggestions, fromDate, toDate } = this.state;
        return (
            <div>
                <h1>Stock Market</h1>
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Enter stock symbol"
                        value={query}
                        onChange={this.handleInputChange}
                    />
                    {showSuggestions && this.renderSuggestions()}
                </div>
                <div className="date-pickers">
                    <DatePicker
                        selected={fromDate}
                        onChange={this.handleFromDateChange}
                        placeholderText="From Date"
                        className="date-picker1"
                    />
                    <DatePicker
                        selected={toDate}
                        onChange={this.handleToDateChange}
                        placeholderText="To Date"
                        className="date-picker2"
                    />
                </div>
                {/* <div className="search-container">
                    <input
                        type="text"
                        placeholder="Enter stock symbol"
                        value={query}
                        onChange={this.handleInputChange}
                    />
                    {showSuggestions && this.renderSuggestions()}
                </div> */}
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <Plot
                        data={[
                            {
                                x: stockChartXValues,
                                y: stockChartYValues,
                                type: 'scatter',
                                mode: 'lines+markers',
                                marker: { color: 'red' },
                            }
                        ]}
                        layout={{ width: 1020, height: 540, title: `Stock Price of ${this.state.stockSymbol}` }}
                    />
                )}
            </div>
        );
    }
}

export default Stock;
