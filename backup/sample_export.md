# Sample Claude Code Session Export

This is an example of what an exported session looks like.

## Session Metadata

**Session ID:** `f33cdb42-0a41-40d4-91eb-c89c109af38a`
**Project:** `/mnt/c/python/myproject`
**Start Time:** 2025-07-02T14:30:00.000Z
**End Time:** 2025-07-02T15:45:30.000Z
**Total Messages:** 42
**User Messages:** 18
**Assistant Messages:** 24
**Tool Uses:** 15
**Models Used:** claude-opus-4-20250514

---

**[2025-07-02 14:30:00]**

### 👤 User

Can you help me create a Python function to calculate fibonacci numbers?

---

**[2025-07-02 14:30:05]**

### 🤖 Assistant (claude-opus-4-20250514)

<details>
<summary>💭 Internal Reasoning (click to expand)</summary>

```
The user wants a Python function to calculate Fibonacci numbers. I should provide a clear, efficient implementation with good practices. I'll offer both an iterative and recursive solution, explaining the trade-offs.
```
</details>

I'll help you create a Python function to calculate Fibonacci numbers. Here's an efficient iterative implementation:

```python
def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n < 0:
        raise ValueError("n must be non-negative")
    elif n <= 1:
        return n
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    
    return b
```

---

**[2025-07-02 14:30:45]**

### 👤 User

Can you also show me a recursive version?

---

**[2025-07-02 14:30:50]**

### 🤖 Assistant (claude-opus-4-20250514)

🔧 **Tool Use: Edit** (ID: toolu_01ABC123xyz)
```json
{
  "file_path": "/mnt/c/python/myproject/fibonacci.py",
  "old_string": "",
  "new_string": "def fibonacci_recursive(n):\n    \"\"\"Calculate the nth Fibonacci number recursively.\"\"\"\n    if n < 0:\n        raise ValueError(\"n must be non-negative\")\n    elif n <= 1:\n        return n\n    \n    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)"
}
```

📊 **Tool Result:**
```
File created successfully at: /mnt/c/python/myproject/fibonacci.py
```

Here's the recursive version of the Fibonacci function. Note that while it's more elegant, it's less efficient for large values of n due to repeated calculations.

---

## Export Summary

This sample demonstrates the key features of exported sessions:

1. **Complete Metadata**: Session ID, timestamps, and statistics
2. **Formatted Conversations**: User and assistant messages with timestamps
3. **Thinking Blocks**: Collapsible sections showing internal reasoning
4. **Tool Usage**: Clear indication of tools used and their results
5. **Markdown Formatting**: Clean, readable output with syntax highlighting

The actual export will contain your entire conversation history in this format.