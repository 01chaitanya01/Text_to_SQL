import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2, Clipboard, Check } from "lucide-react";

const SQLQueryForm = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copid, setCopid] = useState(false);
  const chatContainerRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { type: "user", text: query }]);
    setQuery("");
    setLoading(true);

    try {
      const trimmedQuery = query.trim();
      const response = await axios.post("http://127.0.0.1:8000/query", {
        user_query: trimmedQuery,
      });

      if (response.data && response.data.results && response.data.columns) {
        setMessages((prev) => [
          ...prev,
          { type: "bot", query: response.data.query, tableData: response.data },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: "No results found!" },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Query execution failed!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopid(true);
    setTimeout(() => setCopid(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-blue-500 mb-4">SQL Assistant</h1>

      {/* Chat Window */}
      <div
        ref={chatContainerRef}
        className="w-full max-w-5xl h-[500px] bg-gray-800 p-4 rounded-lg shadow-lg overflow-y-auto flex flex-col space-y-3"
      >
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-3 max-w-[80%] rounded-lg ${
              msg.type === "user"
                ? "bg-blue-500 self-end"
                : "bg-gray-700 self-start"
            }`}
          >
            {msg.query && (
              <div className="mb-2 p-2 bg-gray-900 rounded-lg flex justify-between items-center border border-gray-600">
                <code className="text-white font-mono text-sm break-words">
                  {msg.query}
                </code>
                <button
                  onClick={() => copyToClipboard(msg.query)}
                  className="ml-2 bg-gray-700 hover:bg-gray-600 p-1 rounded-lg"
                >
                  {copid ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Clipboard className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            )}
            {msg.tableData ? (
              <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="min-w-full border border-gray-600 text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      {msg.tableData.columns.map((col, i) => (
                        <th
                          key={i}
                          className="border border-gray-600 px-4 py-2 text-left"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {msg.tableData.results.length > 0 ? (
                      msg.tableData.results.map((row, i) => (
                        <tr
                          key={i}
                          className="odd:bg-gray-800 even:bg-gray-700"
                        >
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="border border-gray-600 px-4 py-2"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={msg.tableData.columns.length}
                          className="text-center p-3"
                        >
                          No data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{msg.text}</p>
            )}
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="p-3 bg-gray-700 self-start rounded-lg flex items-center"
          >
            <Loader2 className="animate-spin w-5 h-5 mr-2 text-blue-500" />
            Executing...
          </motion.div>
        )}
      </div>

      {/* Query Input */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl bg-gray-800 p-4 rounded-lg shadow-lg mt-4 flex"
      >
        <textarea
          rows="2"
          className="w-full p-3 text-white bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="Ask your SQL query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          className="ml-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-all disabled:bg-gray-600"
          disabled={loading}
        >
          {loading ? "Executing..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default SQLQueryForm;
