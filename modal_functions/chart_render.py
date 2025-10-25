import modal
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import base64
import os
import json
from io import BytesIO

app = modal.App("chart-generator")

# Image with chart libraries
image = modal.Image.debian_slim().pip_install(
    "matplotlib",
    "seaborn", 
    "pandas",
    "numpy",
    "fastapi[standard]"
)

@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def generate_chart(request_body: dict) -> dict:
    """
    Execute validated Python chart code and return base64-encoded PNG.
    Code is already validated by Code Interpreter.
    """
    # Extract code from request body
    code = request_body.get("code", "")
    
    if not code:
        return {"error": "No code provided in request body"}
    
    # Handle data file if provided
    data_file_info = request_body.get("dataFile")
    if data_file_info:
        try:
            # Create /mnt/data directory
            os.makedirs('/mnt/data', exist_ok=True)
            
            # Decode base64 file data
            file_buffer = base64.b64decode(data_file_info["buffer"])
            filename = data_file_info["filename"]
            file_path = f'/mnt/data/{filename}'
            
            # Save file to /mnt/data/
            with open(file_path, 'wb') as f:
                f.write(file_buffer)
            
            print(f"📁 Saved data file: {file_path} ({len(file_buffer)} bytes)")
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to save data file: {str(e)}"
            }
    
    # Create a namespace for execution
    def read_json_flexible(file_path):
        """Try multiple methods to read JSON file"""
        try:
            # Try standard pandas read_json
            return pd.read_json(file_path)
        except:
            try:
                # Try reading as JSON Lines (one JSON object per line)
                return pd.read_json(file_path, lines=True)
            except:
                try:
                    # Try reading with different orient parameters
                    return pd.read_json(file_path, orient='records')
                except:
                    try:
                        # Try reading as nested JSON
                        return pd.read_json(file_path, orient='index')
                    except:
                        try:
                            # Try reading with json module and convert to DataFrame
                            with open(file_path, 'r') as f:
                                data = json.load(f)
                                if isinstance(data, list):
                                    return pd.DataFrame(data)
                                elif isinstance(data, dict):
                                    # Try to convert dict to DataFrame
                                    if all(isinstance(v, (list, dict)) for v in data.values()):
                                        return pd.DataFrame(data)
                                    else:
                                        return pd.DataFrame([data])
                                else:
                                    return pd.DataFrame(data)
                        except Exception as e:
                            raise ValueError(f"Could not read JSON file {file_path}: {str(e)}")

    namespace = {
        'plt': plt,
        'sns': sns,
        'pd': pd,
        'pandas': pd,
        'np': np,
        'numpy': np,
        'read_json_flexible': read_json_flexible,
    }
    
    try:
        # Execute the validated code
        exec(code, namespace)
        
        # Save to bytes
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=300, bbox_inches='tight')
        buf.seek(0)
        image_bytes = buf.read()
        plt.close()
        
        # Convert to base64 for JSON response
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        return {
            "success": True,
            "image": image_base64,
            "size": len(image_bytes)
        }
        
    except Exception as e:
        plt.close()  # Clean up on error
        return {
            "success": False,
            "error": f"Chart execution failed: {str(e)}"
        }

# For local testing
if __name__ == "__main__":
    # Test with sample code
    test_request = {
        "code": """
import matplotlib.pyplot as plt
import numpy as np

# Create sample data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create the plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sample Sine Wave')
plt.xlabel('X')
plt.ylabel('Y')
plt.grid(True, alpha=0.3)
"""
    }
    
    result = generate_chart.remote(test_request)
    if result.get("success"):
        print(f"Generated chart: {result.get('size')} bytes")
    else:
        print(f"Error: {result.get('error')}")
