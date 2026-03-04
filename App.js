import { useState } from "react";

function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeCode = async () => {
    if (!code.trim()) {
      alert("Please enter code first");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Backend not connected!");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1>Rule-Based Code Explainer</h1>

      <textarea
        style={styles.textarea}
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <br />

      <button style={styles.button} onClick={analyzeCode}>
        {loading ? "Analyzing..." : "Analyze Code"}
      </button>

      {result && (
        <div style={styles.resultBox}>
          <h2>Explanation</h2>
          <pre>{result.explanation}</pre>

          {/* ✅ FIXED EXECUTION STEPS TABLE */}
          {result.steps && result.steps.length > 0 && (
            <>
              <h2>Execution Steps</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.cell}>Step</th>
                    <th style={styles.cell}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.steps.map((step, index) => (
                    <tr key={index}>
                      <td style={styles.cell}>{step.step}</td>
                      <td style={styles.cell}>{step.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ✅ PROGRAM STATE TABLE */}
          {result.stateTable && result.stateTable.length > 0 && (
            <>
              <h2>Program State Table</h2>
              {result.stateTable.map((state, index) => (
                <div key={index} style={styles.stateBox}>
                  <strong>Step {state.step}</strong>
                  <pre>
                    {JSON.stringify(state.variables, null, 2)}
                  </pre>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    fontFamily: "Arial",
    maxWidth: "900px",
    margin: "auto"
  },
  textarea: {
    width: "100%",
    height: "200px",
    fontSize: "16px",
    padding: "10px"
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer"
  },
  resultBox: {
    marginTop: "40px",
    padding: "20px",
    backgroundColor: "#f4f4f4",
    borderRadius: "8px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  },
  cell: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "left"
  },
  stateBox: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#ffffff",
    border: "1px solid #ccc",
    borderRadius: "5px"
  }
};

export default App;