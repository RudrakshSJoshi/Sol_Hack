using System.Text.Json;
using System.Text.RegularExpressions;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("🔍 Validating tool and agent definitions...");

        string baseDir = args.Length > 0 ? args[0] : Directory.GetCurrentDirectory();

        string[] files = Directory.GetFiles(baseDir, "*.py", SearchOption.AllDirectories);
        foreach (var file in files)
        {
            string content = File.ReadAllText(file);

            if (content.Contains("@tools.register"))
            {
                Console.WriteLine($"📄 Checking tools in {Path.GetFileName(file)}...");
                ValidateTools(content);
            }

            if (content.Contains("@agents.register"))
            {
                Console.WriteLine($"📄 Checking agents in {Path.GetFileName(file)}...");
                ValidateAgents(content);
            }
        }

        Console.WriteLine("✅ Validation complete.");
    }

    static void ValidateTools(string code)
    {
        var regex = new Regex(@"@tools\.register\((.*?)\)", RegexOptions.Singleline);
        foreach (Match match in regex.Matches(code))
        {
            string inner = match.Groups[1].Value;
            if (!inner.Contains("name") || !inner.Contains("description"))
            {
                Console.WriteLine("❌ Tool missing 'name' or 'description'.");
            }
        }
    }

    static void ValidateAgents(string code)
    {
        var regex = new Regex(@"@agents\.register\((.*?)\)", RegexOptions.Singleline);
        foreach (Match match in regex.Matches(code))
        {
            string inner = match.Groups[1].Value;
            if (!inner.Contains("tool_access") || !inner.Contains("response_type"))
            {
                Console.WriteLine("❌ Agent missing 'tool_access' or 'response_type'.");
            }
        }
    }
}
