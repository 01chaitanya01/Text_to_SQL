import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

const DatabaseConfigForm = () => {
    const [dbConfig, setDbConfig] = useState({
        host: "",
        user: "",
        password: "",
        database: ""
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setDbConfig({ ...dbConfig, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(false);
        setModalVisible(true);

        try {
            await axios.post("http://127.0.0.1:8000/connect", dbConfig);
            setTimeout(() => {
                setLoading(false);
                setSuccess(true);
                setTimeout(() => {
                    setModalVisible(false);
                    navigate("/query");
                }, 1500);
            }, 1500);
        } catch (error) {
            setLoading(false);
            setError(true);
            setTimeout(() => setModalVisible(false), 2000);
            console.error(error);
        }
    };

    return (
        <div className="flex justify-center items-center bg-gray-900">
            <form 
                onSubmit={handleSubmit} 
                className="bg-gray-800 p-8 rounded-xl shadow-lg w-96 border border-gray-700"
            >
                <h2 className="text-2xl font-bold text-white text-center mb-6">Database Configuration</h2>

                <div className="space-y-4">
                    <input
                        type="text"
                        name="host"
                        placeholder="Host"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="user"
                        placeholder="User"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="database"
                        placeholder="Database Name"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleChange}
                        required
                    />
                    
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                        disabled={loading || success}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : success ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                            "Connect"
                        )}
                    </button>
                </div>
            </form>

            {/* Modal for loading, success, and error */}
            {modalVisible && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 flex items-center justify-center bg-grey bg-opacity-0"
                >
                    <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                        {loading && (
                            <>
                                <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
                                <p className="mt-2">Connecting...</p>
                            </>
                        )}
                        {success && (
                            <>
                                <CheckCircle className="w-10 h-10 text-green-500" />
                                <p className="mt-2 text-green-400 font-bold">Connected Successfully!</p>
                            </>
                        )}
                        {error && (
                            <>
                                <XCircle className="w-10 h-10 text-red-500" />
                                <p className="mt-2 text-red-400 font-bold">Connection Failed!</p>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default DatabaseConfigForm;
