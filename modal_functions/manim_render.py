import modal
import subprocess
import requests
import os
import re
from pydantic import BaseModel
from fastapi import Request

def sanitize_unicode(text):
    """Remove or replace problematic Unicode characters"""
    try:
        # Try to encode as UTF-8 to catch problematic characters
        text.encode('utf-8')
        return text
    except UnicodeEncodeError:
        # Replace problematic characters with safe alternatives
        # Remove surrogate characters and other problematic Unicode
        import re
        # Remove surrogate pairs and other problematic characters
        sanitized = re.sub(r'[\ud800-\udfff]', '', text)  # Remove surrogates
        sanitized = re.sub(r'[^\x00-\x7F\u00A0-\uFFFF]', '?', sanitized)  # Replace other problematic chars
        print("⚠️ Sanitized problematic Unicode characters")
        return sanitized

def fix_syntax_errors(code):
    """Fix common syntax errors in generated Python code"""
    # First sanitize Unicode
    code = sanitize_unicode(code)
    
    lines = code.split('\n')
    fixed_lines = []
    paren_count = 0
    bracket_count = 0
    brace_count = 0
    
    for i, line in enumerate(lines):
        # Sanitize each line
        line = sanitize_unicode(line)
        
        # Count parentheses, brackets, and braces
        paren_count += line.count('(') - line.count(')')
        bracket_count += line.count('[') - line.count(']')
        brace_count += line.count('{') - line.count('}')
        
        # Skip lines that are just closing parentheses without content
        if line.strip() == ')' and paren_count < 0:
            print(f"⚠️ Removing orphaned closing parenthesis at line {i+1}")
            continue
            
        # Skip lines that are just closing brackets without content
        if line.strip() == ']' and bracket_count < 0:
            print(f"⚠️ Removing orphaned closing bracket at line {i+1}")
            continue
            
        # Skip lines that are just closing braces without content
        if line.strip() == '}' and brace_count < 0:
            print(f"⚠️ Removing orphaned closing brace at line {i+1}")
            continue
        
        # Skip orphaned string literals (lines that are just strings without proper context)
        if (line.strip().startswith('"') and line.strip().endswith('"') and 
            '=' not in line and 'self.' not in line and 'print(' not in line and
            'Text(' not in line and 'Tex(' not in line and 'MathTex(' not in line):
            print(f"⚠️ Removing orphaned string literal at line {i+1}: {line.strip()[:50]}...")
            continue
            
        fixed_lines.append(line)
    
    # Add missing closing parentheses if needed
    while paren_count > 0:
        fixed_lines.append(')')
        paren_count -= 1
        print("⚠️ Added missing closing parenthesis")
    
    while bracket_count > 0:
        fixed_lines.append(']')
        bracket_count -= 1
        print("⚠️ Added missing closing bracket")
        
    while brace_count > 0:
        fixed_lines.append('}')
        brace_count -= 1
        print("⚠️ Added missing closing brace")
    
    return '\n'.join(fixed_lines)

def fix_indentation(code):
    """Fix indentation issues in Python code while preserving structure"""
    lines = code.split('\n')
    fixed_lines = []
    in_class = False
    in_method = False
    first_non_empty_line = True
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        
        # Skip empty lines - preserve them
        if not line_stripped:
            fixed_lines.append('')
            continue
        
        # CRITICAL: First non-empty line should NEVER have indentation
        if first_non_empty_line:
            if line_stripped.startswith('import ') or line_stripped.startswith('from '):
                fixed_lines.append(line_stripped)  # NO indentation for imports
                in_class = False
                in_method = False
                first_non_empty_line = False
            elif line_stripped.startswith('class '):
                fixed_lines.append(line_stripped)  # NO indentation for class
                in_class = True
                in_method = False
                first_non_empty_line = False
            elif line_stripped.startswith('def '):
                fixed_lines.append(line_stripped)  # NO indentation for top-level def
                in_method = False
                first_non_empty_line = False
            else:
                # Any other first line should also have no indentation
                fixed_lines.append(line_stripped)
                first_non_empty_line = False
            continue
        
        # Top-level imports and class definitions - NO indentation
        if line_stripped.startswith('import ') or line_stripped.startswith('from '):
            fixed_lines.append(line_stripped)
            in_class = False
            in_method = False
        elif line_stripped.startswith('class '):
            fixed_lines.append(line_stripped)
            in_class = True
            in_method = False
        elif line_stripped.startswith('def '):
            if in_class:
                # Method inside class - indent 4 spaces
                fixed_lines.append('    ' + line_stripped)
                in_method = True
            else:
                # Top-level function - no indent
                fixed_lines.append(line_stripped)
                in_method = False
        elif in_method and line_stripped.startswith('self.'):
            # Code inside method - indent 8 spaces
            fixed_lines.append('        ' + line_stripped)
        elif in_method:
            # Other code inside method - indent 8 spaces
            fixed_lines.append('        ' + line_stripped)
        else:
            # Preserve original indentation if not in a known context
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def aggressive_syntax_cleanup(code):
    """Aggressively clean up syntax errors by removing problematic lines and fixing indentation"""
    # First sanitize Unicode
    code = sanitize_unicode(code)
    
    lines = code.split('\n')
    cleaned_lines = []
    expected_indent = 0
    
    for i, line in enumerate(lines):
        # Sanitize each line
        line = sanitize_unicode(line)
        line_stripped = line.strip()
        
        # Skip lines that are just string literals without context
        if (line_stripped.startswith('"') and line_stripped.endswith('"') and
            '=' not in line and 'self.' not in line and 'print(' not in line and
            'Text(' not in line and 'Tex(' not in line and 'MathTex(' not in line):
            print(f"⚠️ Aggressively removing string literal at line {i+1}")
            continue
            
        # Skip lines that are just closing delimiters
        if line_stripped in [')', ']', '}']:
            print(f"⚠️ Aggressively removing closing delimiter at line {i+1}")
            continue
            
        # Skip lines that look like orphaned text
        if (line_stripped and not line_stripped.startswith('#') and 
            not line_stripped.startswith('import') and
            not line_stripped.startswith('from') and
            not line_stripped.startswith('class') and
            not line_stripped.startswith('def') and
            not line_stripped.startswith('self.') and
            not line_stripped.startswith('    ') and
            '=' not in line and
            line_stripped.count('"') == 2 and line_stripped.startswith('"') and line_stripped.endswith('"')):
            print(f"⚠️ Aggressively removing orphaned text at line {i+1}")
            continue
        
        # Fix indentation issues
        if line_stripped:
            # Calculate proper indentation based on context
            if line_stripped.startswith('class ') or line_stripped.startswith('def '):
                expected_indent = 0
            elif line_stripped.startswith('self.'):
                expected_indent = 8  # Inside class method
            else:
                expected_indent = 8  # Default for method content
            
            # Fix the indentation
            fixed_line = ' ' * expected_indent + line_stripped
            cleaned_lines.append(fixed_line)
        else:
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

# Create Modal app
app = modal.App("manim-explainer")

# Request model
class RenderRequest(BaseModel):
    code: str
    scene_name: str
    upload_url: str = None
    openai_api_key: str = None
    resolution: str = "720p"
    aspect_ratio: str = "16:9"
    duration: int = 8
    style: str = "auto"

def validate_chart_completeness(code: str) -> list[str]:
    """Validate that charts have required elements."""
    warnings = []
    
    if 'Axes(' in code or 'ax.plot' in code:
        # This is a chart
        if 'get_x_axis_label' not in code and 'x_label' not in code.lower():
            warnings.append("Chart missing x-axis label")
        if 'get_y_axis_label' not in code and 'y_label' not in code.lower():
            warnings.append("Chart missing y-axis label")
        if 'Text(' not in code or 'title' not in code.lower():
            warnings.append("Chart may be missing title")
    
    return warnings

def validate_text_latex_usage(code: str) -> list[str]:
    """Validate proper Text/LaTeX usage."""
    warnings = []
    
    # Check for mathematical symbols in Text()
    import re
    text_matches = re.findall(r'Text\([^)]*\)', code)
    math_patterns = ['x^2', 'y^2', 'z^2', '^2', '^3', r'\frac', r'\sqrt', '=', r'\pm', r'\times']
    for text_match in text_matches:
        if any(pattern in text_match for pattern in math_patterns):
            warnings.append(f"Mathematical symbols in Text() - should use MathTex(): {text_match[:50]}...")
            break
    
    # Check for LaTeX without raw strings
    latex_matches = re.findall(r'(MathTex|Tex)\([^)]*\)', code)
    for latex_match in latex_matches:
        if '\\' in latex_match and 'r"' not in latex_match and "r'" not in latex_match:
            warnings.append(f"LaTeX without raw string - may cause issues: {latex_match[:50]}...")
            break
    
    # Check for proper MathTex isolation for coloring
    if 'MathTex(' in code and 'set_color_by_tex' in code and '{{' not in code:
        warnings.append("MathTex with coloring should use {{ }} for part isolation")
    
    return warnings

# Define container image with all dependencies pre-installed
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "ffmpeg",
        "sox",
        "libsox-fmt-all",
        "portaudio19-dev",
        "gettext",
        "pkg-config",
        "libcairo2-dev",
        "libpango1.0-dev",
        "libpangocairo-1.0-0",
        "libgirepository1.0-dev",
        "libglib2.0-dev",
        "libffi-dev",
        "libxml2-dev",
        "libxslt1-dev",
        "zlib1g-dev",
        "libjpeg-dev",
        "libpng-dev",
        "libfreetype6-dev",
        "libx11-dev",
        "libxext-dev",
        "libxrender-dev",
        "libxrandr-dev",
        "libxinerama-dev",
        "libxcursor-dev",
        "libxi-dev",
        "libxss-dev",
        "libxcomposite-dev",
        "libxdamage-dev",
        "libxfixes-dev",
        "libxtst-dev",
        "build-essential",
        "cmake",
        "git",
        # LaTeX dependencies for MathTex
        "texlive",
        "texlive-latex-extra",
        "texlive-fonts-recommended",
        "texlive-fonts-extra",
        "libgs-dev",
        "dvipng"
    )
    .pip_install(
        "manim==0.18.1",
        "manim-voiceover[openai]",
        "requests",
        "fastapi[standard]"
    )
)

@app.function(
    image=image,
    timeout=1800,  # 30 minutes
    cpu=4.0,
    memory=8192,
)
@modal.fastapi_endpoint(method="POST")
def render_manim(request_body: dict) -> dict:
    """Render Manim animation and optionally upload to Supabase."""
    
    # Extract parameters from request body
    code = request_body.get("code", "")
    scene_name = request_body.get("scene_name", "GeneratedScene")
    upload_url = request_body.get("upload_url")
    resolution = request_body.get("resolution", "720p")
    aspect_ratio = request_body.get("aspect_ratio", "16:9")
    duration = request_body.get("duration", 8)
    style = request_body.get("style", "auto")
    
    if not code:
        return {
            "success": False,
            "error": "No code provided in request body"
        }
    
    # Map resolution to Manim quality flag
    quality_map = {
        '480p': '-ql',  # Low quality
        '720p': '-qh',  # High quality
        '1080p': '-qk', # 4K quality
    }
    quality_flag = quality_map.get(resolution, '-qh')
    
    # Calculate resolution dimensions from aspect ratio and resolution
    height = int(resolution.replace('p', ''))
    if aspect_ratio == '16:9':
        width = int(height * 16 / 9)
    elif aspect_ratio == '9:16':
        width = int(height * 9 / 16)
    elif aspect_ratio == '1:1':
        width = height
    else:
        # Default to 16:9
        width = int(height * 16 / 9)
    
    resolution_str = f"{width}x{height}"
    
    print(f"🎬 Rendering with: {quality_flag} (resolution: {resolution_str}, duration: {duration}s, style: {style})")
    
    result = None
    
    try:
        # Sanitize Unicode before writing
        code = sanitize_unicode(code)
        
        # Write scene.py
        with open("scene.py", "w", encoding='utf-8') as f:
            f.write(code)
        
        print(f"📝 Written scene.py with {len(code)} characters")
        
        # Validate that the scene name exists in the code
        if f"class {scene_name}" not in code:
            print(f"⚠️ Warning: Scene name '{scene_name}' not found in code")
            # Try to extract the actual scene name from the code
            import re
            scene_match = re.search(r'class\s+(\w+)\s*\(\s*(?:Voiceover)?Scene\s*\)', code)
            if scene_match:
                detected_name = scene_match.group(1)
                print(f"   Detected scene name: '{detected_name}'")
                scene_name = detected_name
            else:
                print(f"   Could not detect scene name, using: '{scene_name}'")
        
        # Validate chart completeness
        chart_warnings = validate_chart_completeness(code)
        if chart_warnings:
            print("⚠️ Chart validation warnings:")
            for warning in chart_warnings:
                print(f"   - {warning}")
        
        # Validate text/LaTeX usage
        text_warnings = validate_text_latex_usage(code)
        if text_warnings:
            print("⚠️ Text/LaTeX validation warnings:")
            for warning in text_warnings:
                print(f"   - {warning}")
        
        print(f"🎬 Rendering scene: {scene_name}")
        
        # Try rendering with voiceover
        try:
            # Build Manim command with dynamic parameters
            manim_cmd = [
                "manim", 
                "--disable_caching", 
                "scene.py", 
                scene_name, 
                quality_flag,  # Dynamic quality flag
                "--format=mp4",
                f"--resolution={resolution_str}"  # Dynamic resolution
            ]
            
            # Add style-based background color if specified
            if style in ['dark', 'cinematic']:
                manim_cmd.extend(["--background_color", "BLACK"])
            elif style == 'clean':
                manim_cmd.extend(["--background_color", "WHITE"])
            
            print(f"🔧 Running Manim command: {' '.join(manim_cmd)}")
            
            result = subprocess.run(
                manim_cmd,
                capture_output=True,
                text=True,
                timeout=1200  # 20 minutes
            )
            
            if result.returncode != 0:
                raise Exception(f"Manim render failed: {result.stderr}")
            
            print("✅ Render completed successfully")
            
        except Exception as e:
            error_msg = str(e)
            print(f"⚠️ Original render failed: {error_msg}")
            
            # Smart fallback decision based on error type
            should_use_fallback = False
            fallback_reason = ""
            
            # Check if this is a voiceover-specific error
            voiceover_errors = [
                "voiceover", "speech", "tts", "openai", "audio", 
                "manim_voiceover", "set_speech_service", "voiceover("
            ]
            
            if any(keyword in error_msg.lower() for keyword in voiceover_errors):
                should_use_fallback = True
                fallback_reason = "voiceover service error"
            elif "syntax" in error_msg.lower() or "indentation" in error_msg.lower():
                should_use_fallback = False
                fallback_reason = "syntax error - let AI fix the code"
            elif "import" in error_msg.lower() or "module" in error_msg.lower():
                should_use_fallback = False
                fallback_reason = "import error - let AI fix the code"
            elif "name" in error_msg.lower() and "not defined" in error_msg.lower():
                should_use_fallback = False
                fallback_reason = "undefined name error - let AI fix the code"
            else:
                # For other errors, try fallback as a last resort
                should_use_fallback = True
                fallback_reason = "unknown error - attempting fallback"
            
            print(f"🔍 Error analysis: {fallback_reason}")
            
            if not should_use_fallback:
                print("❌ Not using fallback - error should be fixed by AI retry")
                raise Exception(f"Original render failed: {error_msg}")
            
            print(f"🔄 Using fallback: {fallback_reason}")
            
            # Create fallback code by removing voiceover components line by line
            # First sanitize the original code
            code = sanitize_unicode(code)
            
            lines = code.split('\n')
            cleaned_lines = []
            skip_until_dedent = False
            skip_until_closing_paren = False
            paren_depth = 0
            base_indent = None
            skip_string_literal = False

            for i, line in enumerate(lines):
                # Sanitize each line
                line = sanitize_unicode(line)
                
                # Skip voiceover imports
                if 'from manim_voiceover' in line or 'import OpenAIService' in line:
                    print(f"⚠️ Removing voiceover import at line {i+1}")
                    continue

                # Replace VoiceoverScene with Scene
                if 'VoiceoverScene' in line:
                    line = line.replace('VoiceoverScene', 'Scene')

                # Skip OpenAIService instantiation (direct calls)
                if 'OpenAIService(' in line:
                    print(f"⚠️ Skipping OpenAIService call at line {i+1}")
                    skip_until_closing_paren = True
                    paren_depth = line.count('(') - line.count(')')
                    # If the line closes all parens, we're done
                    if paren_depth <= 0:
                        skip_until_closing_paren = False
                    continue

                # If we're skipping a multi-line OpenAIService or set_speech_service block
                if skip_until_closing_paren:
                    paren_depth += line.count('(') - line.count(')')
                    if paren_depth <= 0:
                        skip_until_closing_paren = False
                        print(f"⚠️ Ending multi-line voiceover service block at line {i+1}")
                    continue

                # Skip voiceover service setup
                if 'self.set_speech_service(' in line:
                    print(f"⚠️ Skipping set_speech_service at line {i+1}")
                    skip_until_closing_paren = True
                    paren_depth = line.count('(') - line.count(')')
                    if paren_depth <= 0:
                        skip_until_closing_paren = False
                    continue

                # Check if this line starts a voiceover block
                if 'with self.voiceover(' in line:
                    skip_until_dedent = True
                    base_indent = len(line) - len(line.lstrip())
                    print(f"⚠️ Skipping voiceover block starting at line {i+1}")
                    continue

                # If we're in a voiceover block, check for dedent
                if skip_until_dedent:
                    current_indent = len(line) - len(line.lstrip())
                    # Check if we've reached the end of the voiceover block
                    if line.strip() == '' or current_indent <= base_indent:
                        skip_until_dedent = False
                        print(f"⚠️ Ending voiceover block at line {i+1}")
                        # Only add the line if it's not empty and not just a closing parenthesis
                        if line.strip() != '' and line.strip() != ')':
                            cleaned_lines.append(line)
                    # Skip all lines inside the voiceover block
                    continue

                # Handle multi-line string literals that might be broken
                if skip_string_literal:
                    if line.strip().endswith('"') or line.strip().endswith("'"):
                        skip_string_literal = False
                        print(f"⚠️ Ending multi-line string literal at line {i+1}")
                    continue

                # Skip orphaned string literals (lines that are just strings without assignment)
                if (line.strip().startswith('"') and line.strip().endswith('"') and 
                    '=' not in line and 'self.' not in line and 'print(' not in line and
                    'Text(' not in line and 'Tex(' not in line and 'MathTex(' not in line):
                    print(f"⚠️ Skipping orphaned string literal at line {i+1}: {line.strip()[:50]}...")
                    continue

                # Check for multi-line string literals that don't end on the same line
                if (line.strip().startswith('"') and not line.strip().endswith('"') and 
                    '=' not in line and 'self.' not in line and 'print(' not in line):
                    skip_string_literal = True
                    print(f"⚠️ Starting multi-line string literal at line {i+1}")
                    continue

                # Replace tracker.duration with fixed run_time
                if 'run_time=tracker.duration' in line:
                    line = line.replace('run_time=tracker.duration', 'run_time=1')

                # Fix LaTeX double braces issue
                if 'MathTex' in line and '{{' in line:
                    line = line.replace('{{', '{ {').replace('}}', '} }')

                # Fix config["style"] issue - Manim 0.18.1 doesn't have style attribute
                if 'config["style"]' in line:
                    line = line.replace('config["style"]', '"dark"')  # Default to dark style
                
                # Fix any other config style references
                if 'config.style' in line:
                    line = line.replace('config.style', '"dark"')
                
                # Fix undefined classes - replace with appropriate Manim alternatives
                undefined_classes = {
                    'PieChart': 'Circle',  # Replace PieChart with Circle
                    'BarChart': 'Rectangle',  # Replace BarChart with Rectangle
                    'LineChart': 'Line',  # Replace LineChart with Line
                    'Histogram': 'Rectangle',  # Replace Histogram with Rectangle
                    'ScatterPlot': 'Dot',  # Replace ScatterPlot with Dot
                    'AreaChart': 'Polygon',  # Replace AreaChart with Polygon
                    'BubbleChart': 'Circle',  # Replace BubbleChart with Circle
                    'RadarChart': 'Polygon',  # Replace RadarChart with Polygon
                    'Heatmap': 'Rectangle',  # Replace Heatmap with Rectangle
                    'Treemap': 'Rectangle',  # Replace Treemap with Rectangle
                }
                
                for undefined_class, replacement in undefined_classes.items():
                    if undefined_class in line:
                        line = line.replace(undefined_class, replacement)
                        print(f"⚠️ Replaced undefined class {undefined_class} with {replacement}")
                
                # Fix LaTeX syntax issues
                if 'MathTex(' in line and '\\frac' in line and 'r"' not in line:
                    # Add raw string prefix for LaTeX
                    line = line.replace('MathTex("', 'MathTex(r"')
                    print("⚠️ Added raw string prefix for LaTeX")
                
                # Fix LaTeX dollar sign issues
                if 'MathTex(' in line and '$' in line and 'r"' not in line:
                    line = line.replace('MathTex("', 'MathTex(r"')
                    print("⚠️ Added raw string for LaTeX with dollar signs")
                
                # Fix LaTeX brace issues
                if 'MathTex(' in line and ('{' in line or '}' in line) and 'r"' not in line:
                    line = line.replace('MathTex("', 'MathTex(r"')
                    print("⚠️ Added raw string for LaTeX with braces")
                
                # Fix common Manim API issues
                if 'ax.get_graph(' in line and 'color=' in line:
                    # Remove color parameter from get_graph as it's not supported
                    line = line.replace('ax.get_graph(', 'ax.plot(')
                    print("⚠️ Fixed ax.get_graph() API usage")
                
                # Fix other common API issues
                if 'get_graph(' in line and 'color=' in line:
                    line = line.replace('get_graph(', 'plot(')
                    print("⚠️ Fixed get_graph() API usage")
                
                # Fix Dot() radius parameter conflicts
                if 'Dot(' in line and 'radius=' in line and '**' in line:
                    # This is a complex case - try to fix radius conflicts
                    if 'vertex_dot_style' in line or '**' in line:
                        print("⚠️ Detected potential Dot() radius conflict - may need manual review")
                
                # Fix plot_line_graph parameter issues
                if 'plot_line_graph(' in line and 'add_vertex_dots=True' in line:
                    # Remove add_vertex_dots to avoid radius conflicts
                    line = line.replace('add_vertex_dots=True', 'add_vertex_dots=False')
                    print("⚠️ Fixed plot_line_graph vertex dots conflict")
                
                # Fix vertex_dot_style radius conflicts
                if 'vertex_dot_style' in line and 'radius' in line:
                    # Remove radius from vertex_dot_style to avoid conflicts
                    line = line.replace('vertex_dot_style={"radius":', 'vertex_dot_style={')
                    line = line.replace('vertex_dot_style={"radius": ', 'vertex_dot_style={')
                    print("⚠️ Fixed vertex_dot_style radius conflict")
                
                # Fix camera.frame API issues (Manim 0.18.1 doesn't have camera.frame)
                if 'self.camera.frame' in line:
                    # Replace camera.frame animations with simpler alternatives
                    if 'animate.scale(' in line:
                        # Replace scale animation with a simple wait
                        line = '        self.wait(0.5)  # Replaced camera.frame.animate.scale()'
                        print("⚠️ Fixed camera.frame.animate.scale() - replaced with wait")
                    elif 'animate.shift(' in line:
                        # Replace shift animation with a simple wait
                        line = '        self.wait(0.5)  # Replaced camera.frame.animate.shift()'
                        print("⚠️ Fixed camera.frame.animate.shift() - replaced with wait")
                    elif 'animate' in line:
                        # Replace any other camera.frame animation
                        line = '        self.wait(0.5)  # Replaced camera.frame animation'
                        print("⚠️ Fixed camera.frame animation - replaced with wait")
                    else:
                        # Just remove the line if it's not an animation
                        line = '        # Removed camera.frame reference'
                        print("⚠️ Removed camera.frame reference")
                
                # Fix VGroup type issues - replace VGroup with Group for mixed object types
                if 'VGroup(' in line and ('Text(' in line or 'MathTex(' in line or 'DecimalNumber(' in line):
                    # Replace VGroup with Group when mixing VMobjects with Mobjects
                    line = line.replace('VGroup(', 'Group(')
                    print("⚠️ Fixed VGroup type issue - replaced with Group for mixed objects")
                
                # Fix VGroup assignments that might cause type issues
                if '= VGroup(' in line and ('Text(' in line or 'MathTex(' in line or 'DecimalNumber(' in line):
                    line = line.replace('= VGroup(', '= Group(')
                    print("⚠️ Fixed VGroup assignment - replaced with Group for mixed objects")

                # ANIMATION QUALITY FIXES
                
                # Fix 1: Ensure minimum wait times
                if 'self.wait(' in line:
                    # Extract wait time and enforce minimum
                    import re
                    match = re.search(r'self\.wait\(([0-9.]+)\)', line)
                    if match:
                        wait_time = float(match.group(1))
                        if wait_time < 1.0:
                            line = line.replace(f'self.wait({wait_time})', 'self.wait(2.0)')
                            print(f"⚠️ Fixed wait time: {wait_time}s → 2.0s")

                # Fix 2: Add wait after play if missing
                if 'self.play(' in line and i < len(lines) - 1:
                    next_line = lines[i + 1] if i + 1 < len(lines) else ''
                    if 'self.wait(' not in next_line and 'self.play(' in next_line:
                        # Insert wait after this play
                        indent = len(line) - len(line.lstrip())
                        cleaned_lines.append(line)
                        cleaned_lines.append(' ' * indent + 'self.wait(2.0)  # Added for proper pacing')
                        print("⚠️ Added missing wait after play")
                        continue

                # Fix 3: Detect overlapping content (simple heuristic)
                if 'self.play(' in line and ('Create(' in line or 'Write(' in line or 'FadeIn(' in line):
                    # Check if previous content was cleared
                    recent_lines = cleaned_lines[-5:] if len(cleaned_lines) >= 5 else cleaned_lines
                    has_fadeout = any('FadeOut(' in l for l in recent_lines)
                    has_clear = any('self.clear()' in l for l in recent_lines)
                    
                    if not has_fadeout and not has_clear and len(cleaned_lines) > 10:
                        # Likely overlapping - add warning comment
                        indent = len(line) - len(line.lstrip())
                        cleaned_lines.append(' ' * indent + '# WARNING: Previous content may overlap - consider FadeOut')
                        print("⚠️ Detected potential overlapping content")

                # Fix 4: Enforce UTF-8 for Text objects
                if 'Text(' in line or 'Tex(' in line:
                    # Ensure proper encoding
                    if '©' in line or 'é' in line or 'è' in line or 'à' in line:
                        # Already has UTF-8 characters - ensure r-string or proper escaping
                        if 'Text("' in line and 'r"' not in line:
                            line = line.replace('Text("', 'Text(r"')
                            print("⚠️ Added r-string for UTF-8 text")

                # Fix 5: Ensure MathTex for equations (Enhanced)
                if 'Text(' in line:
                    # Check for common mathematical symbols/patterns
                    math_patterns = ['x^2', 'y^2', 'z^2', '=', '\\frac', '\\sqrt', 
                                   '^2', '^3', '_1', '_2', '\\pm', '\\times', 
                                   '\\div', '\\leq', '\\geq', '\\neq']
                    if any(pattern in line for pattern in math_patterns):
                        # This looks like math - suggest MathTex
                        cleaned_lines.append('        # WARNING: Consider using MathTex() instead of Text() for equations')
                        print("⚠️ Detected equation in Text - should use MathTex")
                
                # Fix 5b: Ensure raw strings for LaTeX
                if ('MathTex(' in line or 'Tex(' in line) and 'r"' not in line and 'r\'' not in line:
                    # Check if it contains LaTeX commands
                    if '\\' in line and ('MathTex("' in line or 'Tex("' in line):
                        # Add warning about missing raw string
                        cleaned_lines.append('        # WARNING: Use raw strings r"..." for LaTeX to avoid backslash issues')
                        print("⚠️ LaTeX without raw string detected")
                
                # Fix 5c: Check for proper MathTex usage with double braces
                if 'MathTex(' in line and '{{' not in line and 'set_color_by_tex' in code:
                    # If using color operations, suggest double braces for isolation
                    cleaned_lines.append('        # TIP: Use {{ }} to isolate parts for coloring: MathTex(r"{{ a^2 }} + {{ b^2 }}")')
                    print("⚠️ MathTex might benefit from {{ }} for part isolation")

                # Fix 6: Add proper run_time to animations
                if 'self.play(' in line and 'run_time' not in line:
                    # Add default run_time
                    line = line.rstrip()
                    if line.endswith(')'):
                        line = line[:-1] + ', run_time=1.5)'
                    print("⚠️ Added default run_time to animation")
                
                # Fix 7: Ensure proper object management for scene cleanup
                if 'self.add(' in line and 'self.play(' in line:
                    # Check if objects are properly stored in variables for cleanup
                    if '=' not in line and 'self.add(' in line:
                        # Object created inline - suggest storing in variable
                        cleaned_lines.append('        # WARNING: Store objects in variables for proper cleanup')
                        print("⚠️ Suggest storing objects in variables for cleanup")
                
                # Fix 8: Detect potential static/moving object issues
                if 'add_updater(' in line:
                    # Objects with updaters should be properly managed
                    cleaned_lines.append('        # NOTE: Object with updater - ensure proper cleanup')
                    print("⚠️ Object with updater detected - ensure proper cleanup")
                
                # Fix 9: Memory optimization - limit object creation
                if 'for i in range(' in line and 'range(100' in line:
                    # Large loops can cause memory issues
                    line = line.replace('range(100', 'range(10')  # Limit to 10 objects
                    print("⚠️ Limited large loop to prevent memory issues")
                
                # Fix 10: Timeout prevention - limit animation duration
                if 'run_time=' in line:
                    # Extract and limit run_time
                    import re
                    match = re.search(r'run_time=([0-9.]+)', line)
                    if match:
                        run_time = float(match.group(1))
                        if run_time > 5.0:  # Limit to 5 seconds max
                            line = line.replace(f'run_time={run_time}', 'run_time=5.0')
                            print(f"⚠️ Limited run_time from {run_time}s to 5.0s")
                
                # Fix 11: Prevent complex nested operations
                if 'VGroup(' in line and 'VGroup(' in line:
                    # Nested VGroups can cause issues
                    line = line.replace('VGroup(VGroup(', 'VGroup(')
                    print("⚠️ Simplified nested VGroup structure")
                
                # Fix 12: Memory-efficient object creation
                if 'Circle(radius=0.1)' in line and 'for' in line:
                    # Small circles in loops can cause memory issues
                    line = line.replace('Circle(radius=0.1)', 'Circle(radius=0.3)')
                    print("⚠️ Increased circle radius to reduce memory usage")

                cleaned_lines.append(line)
            
            fallback_code = '\n'.join(cleaned_lines)
            
            # Extract the actual class name from the fallback code
            fallback_class_name = scene_name  # Default to original name
            for line in cleaned_lines:
                if 'class ' in line and 'Scene' in line:
                    # Extract class name from "class ClassName(Scene):"
                    match = re.search(r'class\s+(\w+)\s*\(', line)
                    if match:
                        fallback_class_name = match.group(1)
                        break
            
            # CRITICAL: Do NOT modify indentation unless absolutely necessary
            # The fallback cleanup above should preserve original indentation
            # Only apply fixes if compilation fails
            
            # First, try to compile without any modifications
            try:
                compile(fallback_code, "<test>", "exec")
                print("✅ Fallback code is syntactically valid without fixes")
            except SyntaxError as initial_error:
                print(f"⚠️ Initial syntax error: {initial_error}")
                print("🔧 Attempting syntax fixes...")
                
                # Only now try to fix syntax errors
                fallback_code = fix_syntax_errors(fallback_code)
                
                # Try compilation again
                try:
                    compile(fallback_code, "<test>", "exec")
                    print("✅ Fallback code fixed by fix_syntax_errors")
                except SyntaxError as second_error:
                    print(f"⚠️ Still has syntax error: {second_error}")
                    print("🔧 Attempting indentation fix...")
                    # Only as last resort, try indentation fix
                    fallback_code = fix_indentation(fallback_code)
            
            # Enhanced validation before writing fallback code
            validation_attempts = 0
            max_validation_attempts = 3
            
            while validation_attempts < max_validation_attempts:
                try:
                    compile(fallback_code, "fallback_scene.py", "exec")
                    print("✅ Fallback code syntax is valid")
                    break
                except SyntaxError as e:
                    validation_attempts += 1
                    print(f"❌ Fallback code syntax error (attempt {validation_attempts}/{max_validation_attempts}): {e}")
                    print(f"   Line {e.lineno}: {e.text}")
                    print(f"   Error type: {type(e).__name__}")
                    
                    if validation_attempts < max_validation_attempts:
                        if "unexpected indent" in str(e).lower():
                            print("🔧 Indentation error detected - applying aggressive indentation fix")
                            # For indentation errors, try a more aggressive approach
                            fallback_code = aggressive_syntax_cleanup(fallback_code)
                            # Re-apply indentation fix
                            fallback_code = fix_indentation(fallback_code)
                        else:
                            print("🔧 General syntax error - applying aggressive cleanup")
                            fallback_code = aggressive_syntax_cleanup(fallback_code)
                    else:
                        print("❌ Failed to fix syntax after maximum attempts - will attempt render anyway")
                        # Log the problematic code for debugging
                        print("🔍 Problematic code preview:")
                        lines = fallback_code.split('\n')
                        start_line = max(0, e.lineno - 3)
                        end_line = min(len(lines), e.lineno + 2)
                        for i in range(start_line, end_line):
                            marker = ">>> " if i == e.lineno - 1 else "    "
                            print(f"{marker}{i+1:3d}: {lines[i]}")
                        break
            
            with open("fallback_scene.py", "w", encoding='utf-8') as f:
                f.write(fallback_code)
            
            # Use same dynamic parameters for fallback render
            fallback_cmd = [
                "manim", 
                "--disable_caching", 
                "fallback_scene.py", 
                fallback_class_name, 
                quality_flag,  # Dynamic quality flag
                "--format=mp4",
                f"--resolution={resolution_str}"  # Dynamic resolution
            ]
            
            # Add style-based background color if specified
            if style in ['dark', 'cinematic']:
                fallback_cmd.extend(["--background_color", "BLACK"])
            elif style == 'clean':
                fallback_cmd.extend(["--background_color", "WHITE"])
            
            print(f"🔧 Running fallback Manim command: {' '.join(fallback_cmd)}")
            
            result = subprocess.run(
                fallback_cmd,
                capture_output=True,
                text=True,
                timeout=1200
            )
            
            if result.returncode != 0:
                raise Exception(f"Fallback render failed: {result.stderr}")
            
            print("✅ Fallback render completed successfully")

        # Find output file - try multiple possible locations for both MP4 and PNG
        possible_video_paths = [
            f"media/videos/scene/1080p60/{scene_name}.mp4",
            f"media/videos/scene/720p30/{scene_name}.mp4",
            f"media/videos/scene/2160p60/{scene_name}.mp4",
            f"media/videos/scene/1440p60/{scene_name}.mp4",
            f"media/videos/fallback_scene/1080p60/{scene_name}.mp4",
            f"media/videos/fallback_scene/720p30/{scene_name}.mp4",
            f"media/videos/fallback_scene/2160p60/{scene_name}.mp4",
        ]

        possible_image_paths = [
            f"media/images/scene/{scene_name}_ManimCE_v0.18.1.png",
            f"media/images/fallback_scene/{scene_name}_ManimCE_v0.18.1.png",
        ]

        # If we used fallback, also try with the detected fallback class name
        if 'fallback_class_name' in locals() and fallback_class_name != scene_name:
            possible_video_paths.extend([
                f"media/videos/fallback_scene/1080p60/{fallback_class_name}.mp4",
                f"media/videos/fallback_scene/720p30/{fallback_class_name}.mp4",
                f"media/videos/fallback_scene/2160p60/{fallback_class_name}.mp4",
            ])
            possible_image_paths.extend([
                f"media/images/fallback_scene/{fallback_class_name}_ManimCE_v0.18.1.png",
            ])

        # Search for any MP4 and PNG files in the media directory
        import glob
        all_mp4_files = glob.glob("media/videos/**/*.mp4", recursive=True)
        all_png_files = glob.glob("media/images/**/*.png", recursive=True)
        
        print(f"🔍 Found {len(all_mp4_files)} MP4 files in media directory:")
        for mp4_file in all_mp4_files:
            print(f"  - {mp4_file}")
            
        print(f"🔍 Found {len(all_png_files)} PNG files in media directory:")
        for png_file in all_png_files:
            print(f"  - {png_file}")

        output_path = None
        output_type = None
        
        # First try to find MP4 files
        for path in possible_video_paths:
            if os.path.exists(path):
                output_path = path
                output_type = "video"
                print(f"📁 Found video output at: {path}")
                break

        # If no MP4 found, try to find PNG files
        if output_path is None:
            for path in possible_image_paths:
                if os.path.exists(path):
                    output_path = path
                    output_type = "image"
                    print(f"📁 Found image output at: {path}")
                    break

        # If still not found, try to find any file that might be our output
        if output_path is None:
            # Look for MP4 files that contain our scene name
            for mp4_file in all_mp4_files:
                if scene_name in mp4_file or (fallback_class_name in mp4_file if 'fallback_class_name' in locals() else False):
                    output_path = mp4_file
                    output_type = "video"
                    print(f"📁 Found video by name match: {mp4_file}")
                    break
            
            # If still no match, use the first MP4 file in the main output directory (exclude partial_movie_files)
            if output_path is None:
                main_mp4_files = [f for f in all_mp4_files if 'partial_movie_files' not in f]
                if main_mp4_files:
                    output_path = main_mp4_files[0]
                    output_type = "video"
                    print(f"📁 Using first available MP4 file: {output_path}")
            
            # Look for PNG files that contain our scene name
            if output_path is None:
                for png_file in all_png_files:
                    if scene_name in png_file or (fallback_class_name in png_file if 'fallback_class_name' in locals() else False):
                        output_path = png_file
                        output_type = "image"
                        print(f"📁 Found image by name match: {png_file}")
                        break
            
            # If still no match, use the first PNG file
            if output_path is None and all_png_files:
                output_path = all_png_files[0]
                output_type = "image"
                print(f"📁 Using first available PNG file: {output_path}")

        if output_path is None:
            raise Exception(f"Output file not found. Tried video paths: {possible_video_paths}. Tried image paths: {possible_image_paths}. Available MP4 files: {all_mp4_files}. Available PNG files: {all_png_files}")
        
        # Upload to Supabase if URL provided
        if upload_url:
            print(f"☁️ Uploading to Supabase...")
            with open(output_path, "rb") as f:
                # Get file size for Content-Length header
                f.seek(0, 2)  # Seek to end
                file_size = f.tell()
                f.seek(0)  # Seek back to beginning
                
                # Set appropriate content type based on output type
                if output_type == "video":
                    content_type = 'video/mp4'
                elif output_type == "image":
                    content_type = 'image/png'
                else:
                    content_type = 'application/octet-stream'
                
                # Upload with proper headers
                headers = {
                    'Content-Type': content_type,
                    'Content-Length': str(file_size)
                }
                
                response = requests.put(upload_url, data=f, headers=headers)
                response.raise_for_status()
            print(f"✅ Upload completed successfully ({output_type})")
        
        return {
            "success": True,
            "logs": result.stdout,
            "stderr": result.stderr,
            "output_path": output_path,
            "output_type": output_type
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error: {error_msg}")
        return {
            "success": False,
            "error": error_msg,
            "logs": getattr(result, 'stdout', ''),
            "stderr": getattr(result, 'stderr', error_msg)
        }

