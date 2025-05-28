const ResultTable = ({ data }) => {
    if (!data || data.length === 0) return <p>No results found.</p>;

    return (
        <table border="1">
            <thead>
                <tr>
                    {Object.keys(data[0]).map((key) => (
                        <th key={key}>{key}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, idx) => (
                    <tr key={idx}>
                        {Object.values(row).map((val, i) => (
                            <td key={i}>{val}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ResultTable;
