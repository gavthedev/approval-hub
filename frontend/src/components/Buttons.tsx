export default function Button({ children, onClick, variant = "primary" }) {
    const styles = {
        primary: { backgroundColor: "#2563eb", color: "white" },
        danger: { backgroundColor: "#dc2626", color: "white" },
        warning: { backgroundColor: "#f59e0b", color: "white" },
    };

    return (
        <button
            onClick={onClick}
            style={{
                ...styles[variant],
                padding: "6px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "5px",
            }}
        >
            {children}
        </button>
    );
}