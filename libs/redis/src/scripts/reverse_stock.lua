-- KEYS[1]: Key chứa số lượng tồn kho (VD: inventory:product:123)
-- ARGV[1]: Số lượng muốn mua (VD: 1)

local currentStock = tonumber(redis.call('GET', KEYS[1]))

-- Nếu key chưa tồn tại hoặc bằng 0 -> Hết hàng
if currentStock == nil or currentStock < tonumber(ARGV[1]) then
    return -1 -- Mã lỗi: Hết hàng
end

-- Nếu còn hàng -> Trừ kho ngay lập tức
redis.call('DECRBY', KEYS[1], ARGV[1])

-- Trả về số lượng còn lại sau khi trừ
return redis.call('GET', KEYS[1])