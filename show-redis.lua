local keys = redis.call("KEYS", "*")
local rows = {
    "| key | value | type |",
    "| --- | --- | --- |"
}

for _, key in ipairs(keys) do
    local value = redis.call("GET", key)
    local kind = redis.call("TYPE", key).ok

    rows[#rows + 1] = string.format(
        "| %s | %s | %s |",
        key,
        tostring(value),
        kind
    )
end

return table.concat(rows, "\n")
